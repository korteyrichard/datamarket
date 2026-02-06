<?php

namespace App\Http\Controllers;

use App\Models\AgentShop;
use App\Models\Cart;
use App\Models\Product;
use App\Models\Order;
use App\Models\Commission;
use App\Models\Transaction;
use App\Services\OrderPusherService;
use App\Services\PaystackService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;

class PublicShopController extends Controller
{
    public function show($username)
    {
        $shop = AgentShop::where('username', '=', $username)
            ->where('is_active', '=', true)
            ->with(['user', 'agentProducts.product'])
            ->first();

        if (!$shop) {
            // Check if the current authenticated user is a dealer without a shop
            if (auth()->check() && auth()->user()->role === 'dealer' && !auth()->user()->agentShop) {
                return redirect()->route('dealer.dashboard')
                    ->with('message', 'You need to create a shop first. Go to the dealer dashboard to set up your shop.');
            }
            
            abort(404, 'Shop not found');
        }

        $products = $shop->agentProducts->where('is_active', true)->map(function ($agentProduct) {
            return [
                'id' => $agentProduct->product->id,
                'name' => $agentProduct->product->name,
                'description' => $agentProduct->product->description,
                'network' => $agentProduct->product->network,
                'base_price' => $agentProduct->product->price,
                'agent_price' => $agentProduct->agent_price,
                'product_type' => $agentProduct->product->product_type,
                'status' => $agentProduct->product->status,
                'quantity' => $agentProduct->product->quantity
            ];
        });

        return Inertia::render('PublicShop', [
            'shop' => [
                'name' => $shop->name,
                'username' => $shop->username,
                'agent_name' => $shop->user->name,
                'color' => $shop->color,
                'whatsapp_contact' => $shop->whatsapp_contact
            ],
            'products' => $products,
            'auth' => [
                'user' => auth()->user()
            ]
        ]);
    }

    public function purchase(Request $request)
    {
        $request->validate([
            'product_id' => 'required|exists:products,id',
            'quantity' => 'required|integer|min:1',
            'beneficiary_number' => 'required|string|size:10|regex:/^[0-9]{10}$/',
            'agent_username' => 'required|string|exists:agent_shops,username',
            'customer_email' => 'required|email'
        ]);

        $shop = AgentShop::where('username', '=', $request->agent_username)->first();
        
        if (!$shop) {
            return redirect()->back()->with('error', 'Shop not found');
        }
        
        $product = Product::findOrFail($request->product_id);
        
        $agentProduct = $shop->agentProducts()->where('product_id', $product->id)->first();
        if (!$agentProduct) {
            return redirect()->back()->with('error', 'Product not available in this shop');
        }

        $total = $agentProduct->agent_price; // Don't multiply by quantity for data bundles
        $reference = 'agent_order_' . \Illuminate\Support\Str::random(16);
        $customerPhone = $request->customer_phone ?? $request->beneficiary_number;
        
        // Store order data in session for payment callback
        session([
            'pending_agent_order' => [
                'agent_id' => $shop->user_id,
                'agent_username' => $request->agent_username, // Store the shop username
                'product_id' => $product->id,
                'quantity' => $request->quantity,
                'price' => $agentProduct->agent_price,
                'beneficiary_number' => $request->beneficiary_number,
                'customer_name' => $request->customer_email,
                'customer_phone' => $customerPhone,
                'total' => $total,
                'reference' => $reference
            ]
        ]);

        // Initialize Paystack payment
        $email = $request->customer_email;
        
        \Illuminate\Support\Facades\Log::info('Initializing Paystack payment', [
            'email' => $email,
            'amount' => $total * 100,
            'reference' => $reference
        ]);
        
        $response = \Illuminate\Support\Facades\Http::withHeaders([
            'Authorization' => 'Bearer ' . config('paystack.secret_key'),
            'Content-Type' => 'application/json',
        ])->post('https://api.paystack.co/transaction/initialize', [
            'email' => $email,
            'amount' => $total * 100, // Convert to kobo
            'callback_url' => route('agent.order.callback'),
            'reference' => $reference,
            'metadata' => [
                'customer_name' => $request->customer_email,
                'customer_phone' => $customerPhone,
                'agent_username' => $request->agent_username,
                'type' => 'agent_order'
            ]
        ]);

        if ($response->successful()) {
            return Inertia::location($response->json('data.authorization_url'));
        }

        // Log the error for debugging
        \Illuminate\Support\Facades\Log::error('Paystack initialization failed', [
            'response' => $response->json(),
            'status' => $response->status()
        ]);

        return redirect()->back()->with('error', 'Payment initialization failed: ' . $response->json('message', 'Unknown error'));
    }

    public function handleOrderCallback(Request $request)
    {
        $reference = $request->reference;
        
        $response = \Illuminate\Support\Facades\Http::withHeaders([
            'Authorization' => 'Bearer ' . config('paystack.secret_key'),
        ])->get("https://api.paystack.co/transaction/verify/{$reference}");

        if ($response->successful() && $response->json('data.status') === 'success') {
            $orderData = session('pending_agent_order');
            
            if ($orderData && $orderData['reference'] === $reference) {
                // Get the shop where the order was made from using the stored username
                $shop = AgentShop::where('username', '=', $orderData['agent_username'])->first();
                
                if (!$shop) {
                    Log::error('Shop not found for commission calculation', [
                        'agent_username' => $orderData['agent_username'],
                        'order_reference' => $reference
                    ]);
                    return redirect()->route('home')->with('error', 'Shop not found');
                }
                
                // Create order record with proper agent_id for commission tracking
                $order = Order::create([
                    'user_id' => $orderData['agent_id'], // Assign to agent whose shop the order was made from
                    'agent_id' => $orderData['agent_id'], // Set agent_id for commission calculation
                    'status' => 'processing',
                    'total' => $orderData['total'],
                    'beneficiary_number' => $orderData['beneficiary_number'],
                    'network' => Product::find($orderData['product_id'])->network,
                    'customer_name' => $orderData['customer_name'],
                    'customer_phone' => $orderData['customer_phone'],
                    'paystack_reference' => $reference,
                    'customer_email' => $orderData['customer_name'] // This is actually email from the form
                ]);

                // Attach product to order with base price in pivot table
                $basePrice = Product::find($orderData['product_id'])->price;
                $order->products()->attach($orderData['product_id'], [
                    'quantity' => $orderData['quantity'],
                    'price' => $basePrice, // Store base price for commission calculation
                    'beneficiary_number' => $orderData['beneficiary_number']
                ]);

                // Use CommissionService for consistent commission calculation
                $order->load('agent.agentShop.agentProducts', 'products');
                $commissionService = new \App\Services\CommissionService();
                // Pass the shop information to the commission service
                $commission = $commissionService->calculateAndCreateCommissionFromShop($order, $shop);

                // Clear session
                session()->forget('pending_agent_order');

                // Push order to external API
                try {
                    $orderPusher = new OrderPusherService();
                    $orderPusher->pushOrderToApi($order);
                } catch (\Exception $e) {
                    \Illuminate\Support\Facades\Log::error('Failed to push agent shop order to external API', [
                        'order_id' => $order->id,
                        'error' => $e->getMessage()
                    ]);
                }

                return redirect()->route('agent.order.success', ['order' => $order->id]);
            }
        }

        return redirect()->route('home')->with('error', 'Payment verification failed');
    }

    public function orderSuccess($orderId)
    {
        $order = Order::with('products')->findOrFail($orderId);
        
        return Inertia::render('OrderSuccess', [
            'order' => $order
        ]);
    }

    public function trackOrder(Request $request)
    {
        $request->validate([
            'beneficiary_number' => 'required|string|size:10|regex:/^[0-9]{10}$/',
            'paystack_reference' => 'required|string|min:10|max:100'
        ]);

        try {
            // First, try to find existing order with indexed query
            $order = Order::where('beneficiary_number', $request->beneficiary_number)
                         ->where('paystack_reference', $request->paystack_reference)
                         ->select('id', 'status', 'total', 'beneficiary_number', 'network', 'customer_email', 'created_at')
                         ->with(['products:id,name,description,network'])
                         ->first();

            if ($order) {
                return response()->json([
                    'success' => true,
                    'order_found' => true,
                    'order' => [
                        'id' => $order->id,
                        'status' => $order->status,
                        'total' => $order->total,
                        'beneficiary_number' => $order->beneficiary_number,
                        'network' => $order->network,
                        'customer_email' => $order->customer_email,
                        'created_at' => $order->created_at->format('Y-m-d H:i:s'),
                        'products' => $order->products->map(function($product) {
                            return [
                                'name' => $product->name,
                                'description' => $product->description,
                                'network' => $product->network
                            ];
                        })
                    ]
                ]);
            }

            // If order not found, verify with Paystack
            $paystackService = new PaystackService();
            $verification = $paystackService->verifyReference($request->paystack_reference);

            if (!$verification['success']) {
                return response()->json([
                    'success' => false,
                    'message' => $verification['message']
                ]);
            }

            return response()->json([
                'success' => true,
                'order_found' => false,
                'can_create_order' => true,
                'payment_data' => $verification['data']
            ]);

        } catch (\Exception $e) {
            Log::error('Order tracking error', [
                'beneficiary_number' => $request->beneficiary_number,
                'reference' => $request->paystack_reference,
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'An error occurred while tracking your order. Please try again.'
            ], 500);
        }
    }

    public function createOrderFromReference(Request $request)
    {
        $request->validate([
            'beneficiary_number' => 'required|string|size:10|regex:/^[0-9]{10}$/',
            'paystack_reference' => 'required|string|min:10|max:100',
            'product_id' => 'required|exists:products,id',
            'agent_username' => 'required|string|exists:agent_shops,username'
        ]);

        try {
            // Verify payment again to ensure security
            $paystackService = new PaystackService();
            $verification = $paystackService->verifyReference($request->paystack_reference);

            if (!$verification['success']) {
                return response()->json([
                    'success' => false,
                    'message' => $verification['message']
                ]);
            }

            $shop = AgentShop::where('username', $request->agent_username)
                            ->where('is_active', true)
                            ->first();
            if (!$shop) {
                return response()->json([
                    'success' => false,
                    'message' => 'Shop not found or inactive'
                ]);
            }

            $product = Product::where('id', $request->product_id)
                             ->where('status', 'IN STOCK')
                             ->first();
            if (!$product) {
                return response()->json([
                    'success' => false,
                    'message' => 'Product not found or out of stock'
                ]);
            }

            $agentProduct = $shop->agentProducts()
                                ->where('product_id', $product->id)
                                ->where('is_active', true)
                                ->first();
            
            if (!$agentProduct) {
                return response()->json([
                    'success' => false,
                    'message' => 'Product not available in this shop'
                ]);
            }

            // Verify payment amount matches product price (allow 1 pesewa difference for rounding)
            $expectedAmount = $agentProduct->agent_price;
            $paidAmount = $verification['data']['amount'];
            
            if (abs($paidAmount - $expectedAmount) > 0.01) {
                return response()->json([
                    'success' => false,
                    'message' => "Payment amount (₵{$paidAmount}) does not match product price (₵{$expectedAmount})"
                ]);
            }

            // Create the order in a database transaction
            \DB::beginTransaction();

            $order = Order::create([
                'user_id' => $shop->user_id,
                'agent_id' => $shop->user_id,
                'status' => 'processing',
                'total' => $expectedAmount,
                'beneficiary_number' => $request->beneficiary_number,
                'network' => $product->network,
                'customer_name' => $verification['data']['email'],
                'customer_phone' => $request->beneficiary_number,
                'paystack_reference' => $request->paystack_reference,
                'customer_email' => $verification['data']['email']
            ]);

            // Attach product to order with correct quantity
            Log::info('Attaching product to recovered order', [
                'product_id' => $product->id,
                'product_name' => $product->name,
                'product_quantity' => $product->quantity,
                'order_id' => $order->id
            ]);
            
            // Extract numeric value from quantity (e.g., "2GB" -> 2)
            $numericQuantity = (int) filter_var($product->quantity, FILTER_SANITIZE_NUMBER_INT);
            if ($numericQuantity <= 0) {
                $numericQuantity = 1; // Default fallback
            }
            
            Log::info('Using numeric quantity', [
                'original_quantity' => $product->quantity,
                'numeric_quantity' => $numericQuantity
            ]);
            
            $order->products()->attach($product->id, [
                'quantity' => $numericQuantity,
                'price' => $product->price,
                'beneficiary_number' => $request->beneficiary_number
            ]);

            // Calculate commission
            $order->load('agent.agentShop.agentProducts', 'products');
            $commissionService = new \App\Services\CommissionService();
            $commission = $commissionService->calculateAndCreateCommissionFromShop($order, $shop);

            \DB::commit();

            // Push order to external API (outside transaction)
            try {
                Log::info('Pushing recovered order to external API', [
                    'order_id' => $order->id,
                    'total' => $order->total,
                    'beneficiary' => $request->beneficiary_number
                ]);
                
                $orderPusher = new OrderPusherService();
                $orderPusher->pushOrderToApi($order);
                
                Log::info('Successfully pushed recovered order to API', ['order_id' => $order->id]);
            } catch (\Exception $e) {
                Log::error('Failed to push recovered order to external API', [
                    'order_id' => $order->id,
                    'error' => $e->getMessage()
                ]);
                // Don't fail the order creation if API push fails
            }

            Log::info('Order created from Paystack reference', [
                'order_id' => $order->id,
                'reference' => $request->paystack_reference,
                'beneficiary' => $request->beneficiary_number,
                'amount' => $expectedAmount
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Order created successfully',
                'order' => [
                    'id' => $order->id,
                    'status' => $order->status,
                    'total' => $order->total,
                    'beneficiary_number' => $order->beneficiary_number,
                    'network' => $order->network
                ]
            ]);

        } catch (\Exception $e) {
            \DB::rollBack();
            
            Log::error('Failed to create order from reference', [
                'reference' => $request->paystack_reference,
                'beneficiary_number' => $request->beneficiary_number,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to create order. Please contact support if this issue persists.'
            ], 500);
        }
    }
}