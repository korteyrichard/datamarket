<?php

namespace App\Http\Controllers;

use App\Models\AgentShop;
use App\Models\Cart;
use App\Models\Product;
use App\Models\Order;
use App\Models\Commission;
use App\Models\Transaction;
use App\Models\MashupPackage;
use App\Models\MashupOrder;
use App\Services\OrderPusherService;
use App\Services\CodeCraftOrderPusherService;
use App\Services\CodeCraftMtnOrderPusherService;
use App\Services\DataFlowOrderPusherService;
use App\Services\PaystackService;
use App\Models\Setting as SettingModel;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Http;
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

        // Get agent mashup products with dealer prices, fallback to base packages
        $agentMashupProducts = $shop->agentMashupProducts()
            ->where('is_active', true)
            ->with('mashupPackage')
            ->get()
            ->filter(fn($amp) => $amp->mashupPackage && $amp->mashupPackage->is_active)
            ->map(fn($amp) => [
                'id' => $amp->mashupPackage->id,
                'name' => $amp->mashupPackage->name,
                'size' => $amp->mashupPackage->size,
                'price' => $amp->agent_price,
            ])
            ->values();

        return Inertia::render('PublicShop', [
            'shop' => [
                'name' => $shop->name,
                'username' => $shop->username,
                'agent_name' => $shop->user->name,
                'color' => $shop->color,
                'whatsapp_contact' => $shop->whatsapp_contact
            ],
            'products' => $products,
            'mashupPackages' => $agentMashupProducts,
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
        $reference = 'agent_order_' . \Illuminate\Support\Str::random(10) . '_' . $request->beneficiary_number;
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
        
        // Prevent duplicate orders from the same payment reference
        if (Order::where('paystack_reference', $reference)->exists()) {
            $existingOrder = Order::where('paystack_reference', $reference)->first();
            return redirect()->route('agent.order.success', ['order' => $existingOrder->id]);
        }

        $response = \Illuminate\Support\Facades\Http::withHeaders([
            'Authorization' => 'Bearer ' . config('paystack.secret_key'),
        ])->get("https://api.paystack.co/transaction/verify/{$reference}");

        if ($response->successful() && $response->json('data.status') === 'success') {
            $orderData = session('pending_agent_order');
            
            if ($orderData && $orderData['reference'] === $reference) {
                $shop = AgentShop::where('username', '=', $orderData['agent_username'])->first();
                
                if (!$shop) {
                    Log::error('Shop not found for commission calculation', [
                        'agent_username' => $orderData['agent_username'],
                        'order_reference' => $reference
                    ]);
                    return redirect()->route('home')->with('error', 'Shop not found');
                }

                $order = DB::transaction(function () use ($orderData, $reference, $shop) {
                    // Double-check inside transaction to prevent race
                    if (Order::where('paystack_reference', $reference)->lockForUpdate()->exists()) {
                        return Order::where('paystack_reference', $reference)->first();
                    }

                    $order = Order::create([
                        'user_id' => $orderData['agent_id'],
                        'agent_id' => $orderData['agent_id'],
                        'status' => 'processing',
                        'total' => $orderData['total'],
                        'beneficiary_number' => $orderData['beneficiary_number'],
                        'network' => Product::find($orderData['product_id'])->network,
                        'customer_name' => $orderData['customer_name'],
                        'customer_phone' => $orderData['customer_phone'],
                        'paystack_reference' => $reference,
                        'customer_email' => $orderData['customer_name']
                    ]);

                    $basePrice = Product::find($orderData['product_id'])->price;
                    $order->products()->attach($orderData['product_id'], [
                        'quantity' => $orderData['quantity'],
                        'price' => $basePrice,
                        'beneficiary_number' => $orderData['beneficiary_number']
                    ]);

                    $order->load('agent.agentShop.agentProducts', 'products');
                    $commissionService = new \App\Services\CommissionService();
                    $commissionService->calculateAndCreateCommissionFromShop($order, $shop);

                    return $order;
                });

                session()->forget('pending_agent_order');

                // Push order to external API
                try {
                    $productName = strtolower(Product::find($orderData['product_id'])->name ?? '');
                    
                    if (stripos($productName, 'telecel') !== false || 
                        stripos($productName, 'at data') !== false || 
                        stripos($productName, 'at (big packages)') !== false) {
                        $orderPusher = new CodeCraftOrderPusherService();
                    } elseif (stripos($productName, 'mtn') !== false && SettingModel::get('dataflow_mtn_api_enabled', 'false') === 'true') {
                        $orderPusher = new DataFlowOrderPusherService();
                    } elseif (stripos($productName, 'mtn') !== false && SettingModel::get('codecraft_mtn_api_enabled', 'false') === 'true') {
                        $orderPusher = new CodeCraftMtnOrderPusherService();
                    } else {
                        $orderPusher = new OrderPusherService();
                    }
                    
                    $orderPusher->pushOrderToApi($order);
                } catch (\Exception $e) {
                    Log::error('Failed to push agent shop order to external API', [
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
            'paystack_reference' => 'required|string|min:10|max:100|starts_with:agent'
        ], [
            'paystack_reference.starts_with' => 'The provided reference is invalid for this shop. It must start with "agent".'
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
            'paystack_reference' => 'required|string|min:10|max:100|starts_with:agent',
            'product_id' => 'required|exists:products,id',
            'agent_username' => 'required|string|exists:agent_shops,username'
        ], [
            'paystack_reference.starts_with' => 'The provided reference is invalid for this shop. It must start with "agent".'
        ]);

        try {
            // Verify payment
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
                return response()->json(['success' => false, 'message' => 'Shop not found or inactive']);
            }

            $product = Product::where('id', $request->product_id)
                             ->where('status', 'IN STOCK')
                             ->first();
            if (!$product) {
                return response()->json(['success' => false, 'message' => 'Product not found or out of stock']);
            }

            $agentProduct = $shop->agentProducts()
                                ->where('product_id', $product->id)
                                ->where('is_active', true)
                                ->first();
            if (!$agentProduct) {
                return response()->json(['success' => false, 'message' => 'Product not available in this shop']);
            }

            // Verify payment amount matches product price
            $expectedAmount = $agentProduct->agent_price;
            $paidAmount = $verification['data']['amount'];
            if (abs($paidAmount - $expectedAmount) > 0.01) {
                return response()->json([
                    'success' => false,
                    'message' => "Payment amount (₵{$paidAmount}) does not match product price (₵{$expectedAmount})"
                ]);
            }

            $order = DB::transaction(function () use ($request, $product, $shop, $expectedAmount, $verification) {
                // Atomic duplicate check inside transaction
                if (Order::where('paystack_reference', $request->paystack_reference)->lockForUpdate()->exists()) {
                    return null;
                }

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

                $numericQuantity = max(1, (int) filter_var($product->quantity, FILTER_SANITIZE_NUMBER_INT));

                $order->products()->attach($product->id, [
                    'quantity' => $numericQuantity,
                    'price' => $product->price,
                    'beneficiary_number' => $request->beneficiary_number
                ]);

                $order->load('agent.agentShop.agentProducts', 'products');
                $commissionService = new \App\Services\CommissionService();
                $commissionService->calculateAndCreateCommissionFromShop($order, $shop);

                return $order;
            });

            if (!$order) {
                return response()->json([
                    'success' => false,
                    'message' => 'This payment reference has already been used for an order'
                ]);
            }

            // Push order to external API (outside transaction)
            try {
                $productName = strtolower($product->name ?? '');
                
                if (stripos($productName, 'telecel') !== false || 
                    stripos($productName, 'at data') !== false || 
                    stripos($productName, 'at (big packages)') !== false) {
                    $orderPusher = new CodeCraftOrderPusherService();
                } elseif (stripos($productName, 'mtn') !== false && SettingModel::get('dataflow_mtn_api_enabled', 'false') === 'true') {
                    $orderPusher = new DataFlowOrderPusherService();
                } elseif (stripos($productName, 'mtn') !== false && SettingModel::get('codecraft_mtn_api_enabled', 'false') === 'true') {
                    $orderPusher = new CodeCraftMtnOrderPusherService();
                } else {
                    $orderPusher = new OrderPusherService();
                }
                
                $orderPusher->pushOrderToApi($order);
            } catch (\Exception $e) {
                Log::error('Failed to push recovered order to external API', [
                    'order_id' => $order->id,
                    'error' => $e->getMessage()
                ]);
            }

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
            Log::error('Failed to create order from reference', [
                'reference' => $request->paystack_reference,
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to create order. Please contact support if this issue persists.'
            ], 500);
        }
    }

    // ─── SHOP MASHUP METHODS ───

    public function mashupCheckout(Request $request)
    {
        $request->validate([
            'mashup_package_id' => 'required|exists:mashup_packages,id',
            'beneficiary_number' => 'required|string|regex:/^[0-9]{10}$/',
            'customer_email' => 'required|email',
            'agent_username' => 'required|string|exists:agent_shops,username',
        ]);

        $package = MashupPackage::where('id', $request->mashup_package_id)
            ->where('is_active', true)
            ->firstOrFail();

        $shop = AgentShop::where('username', $request->agent_username)
            ->where('is_active', true)
            ->firstOrFail();

        // Use agent's custom price if they have this mashup in their shop
        $agentMashup = $shop->agentMashupProducts()
            ->where('mashup_package_id', $package->id)
            ->where('is_active', true)
            ->first();

        $chargeAmount = $agentMashup ? $agentMashup->agent_price : $package->price;

        $reference = 'shop_mashup_' . Str::random(10) . '_' . $request->beneficiary_number;

        $response = Http::withHeaders([
            'Authorization' => 'Bearer ' . config('paystack.secret_key'),
            'Content-Type' => 'application/json',
        ])->post('https://api.paystack.co/transaction/initialize', [
            'email' => $request->customer_email,
            'amount' => $chargeAmount * 100,
            'callback_url' => route('shop.mashup.callback'),
            'reference' => $reference,
            'metadata' => [
                'mashup_package_id' => $package->id,
                'customer_email' => $request->customer_email,
                'beneficiary_number' => $request->beneficiary_number,
                'agent_username' => $request->agent_username,
            ],
        ]);

        if ($response->successful()) {
            return Inertia::location($response->json('data.authorization_url'));
        }

        return back()->with('error', 'Payment initialization failed');
    }

    public function mashupCallback(Request $request)
    {
        $reference = $request->reference;

        $response = Http::withHeaders([
            'Authorization' => 'Bearer ' . config('paystack.secret_key'),
        ])->get("https://api.paystack.co/transaction/verify/{$reference}");

        if (!$response->successful() || $response->json('data.status') !== 'success') {
            return redirect()->route('home')->with('error', 'Payment verification failed');
        }

        $existing = MashupOrder::where('paystack_reference', $reference)->first();
        if ($existing) {
            return redirect()->route('home')->with('success', 'Order already exists.');
        }

        $metadata = $response->json('data.metadata');
        $package = MashupPackage::find($metadata['mashup_package_id']);

        if (!$package) {
            return redirect()->route('home')->with('error', 'Package not found');
        }

        $paidAmount = $response->json('data.amount') / 100;

        // Determine shop owner
        $shopUsername = $metadata['agent_username'] ?? null;
        $shop = $shopUsername ? AgentShop::where('username', $shopUsername)->where('is_active', true)->first() : null;

        $mashupOrder = MashupOrder::create([
            'user_id' => $shop ? $shop->user_id : null,
            'mashup_package_id' => $package->id,
            'beneficiary_number' => $metadata['beneficiary_number'],
            'amount' => $paidAmount,
            'status' => 'pending',
            'paystack_reference' => $reference,
            'customer_email' => $metadata['customer_email'],
        ]);

        // Calculate commission for the dealer (agent_price - base_price)
        if ($shop) {
            $agentMashup = $shop->agentMashupProducts()
                ->where('mashup_package_id', $package->id)
                ->where('is_active', true)
                ->first();

            if ($agentMashup) {
                $commission = $agentMashup->agent_price - $package->price;
                if ($commission > 0) {
                    Commission::create([
                        'agent_id' => $shop->user_id,
                        'order_id' => null,
                        'mashup_order_id' => $mashupOrder->id,
                        'amount' => $commission,
                        'status' => 'available',
                        'available_at' => now(),
                    ]);
                }
            }

            return redirect('/shop/' . $shopUsername)->with('success', 'Mashup order placed successfully!');
        }

        return redirect()->route('home')->with('success', 'Mashup order placed successfully!');
    }

    public function mashupTrackOrder(Request $request)
    {
        $request->validate([
            'paystack_reference' => 'required|string|starts_with:shop_mashup_|min:10|max:100',
        ], [
            'paystack_reference.starts_with' => 'Only shop mashup references are allowed here.',
        ]);

        try {
            $order = MashupOrder::where('paystack_reference', $request->paystack_reference)
                ->with('package')
                ->first();

            if ($order) {
                return response()->json([
                    'success' => true,
                    'order_found' => true,
                    'order' => [
                        'id' => $order->id,
                        'status' => $order->status,
                        'amount' => $order->amount,
                        'beneficiary_number' => $order->beneficiary_number,
                        'package_name' => $order->package->name ?? 'N/A',
                        'package_size' => $order->package->size ?? 'N/A',
                        'created_at' => $order->created_at->format('Y-m-d H:i:s'),
                    ],
                ]);
            }

            // Verify with Paystack and create order
            $paystackResponse = Http::withHeaders([
                'Authorization' => 'Bearer ' . config('paystack.secret_key'),
            ])->timeout(30)->get("https://api.paystack.co/transaction/verify/{$request->paystack_reference}");

            if (!$paystackResponse->successful()) {
                return response()->json(['success' => false, 'message' => 'Failed to verify with Paystack']);
            }

            $data = $paystackResponse->json('data');
            if (!$data || $data['status'] !== 'success') {
                return response()->json(['success' => false, 'message' => 'Payment was not successful']);
            }

            $paidAmount = $data['amount'] / 100;
            $metadata = $data['metadata'] ?? [];

            $package = MashupPackage::where('id', $metadata['mashup_package_id'] ?? 0)
                ->where('is_active', true)
                ->first();

            if (!$package || abs($package->price - $paidAmount) > 0.01) {
                return response()->json(['success' => false, 'message' => 'Could not match payment to a mashup package.']);
            }

            $order = DB::transaction(function () use ($request, $package, $metadata) {
                if (MashupOrder::where('paystack_reference', $request->paystack_reference)->lockForUpdate()->exists()) {
                    return MashupOrder::where('paystack_reference', $request->paystack_reference)->first();
                }

                $shopUsername = $metadata['agent_username'] ?? null;
                $shop = $shopUsername ? AgentShop::where('username', $shopUsername)->where('is_active', true)->first() : null;

                return MashupOrder::create([
                    'user_id' => $shop ? $shop->user_id : null,
                    'mashup_package_id' => $package->id,
                    'beneficiary_number' => $metadata['beneficiary_number'] ?? 'unknown',
                    'amount' => $package->price,
                    'status' => 'pending',
                    'paystack_reference' => $request->paystack_reference,
                    'customer_email' => $metadata['customer_email'] ?? '',
                ]);
            });

            return response()->json([
                'success' => true,
                'order_found' => true,
                'order' => [
                    'id' => $order->id,
                    'status' => $order->status,
                    'amount' => $order->amount,
                    'beneficiary_number' => $order->beneficiary_number,
                    'package_name' => $package->name,
                    'package_size' => $package->size,
                    'created_at' => $order->created_at->format('Y-m-d H:i:s'),
                ],
                'message' => 'Order recovered successfully!',
            ]);
        } catch (\Exception $e) {
            Log::error('Shop mashup track error', ['error' => $e->getMessage()]);
            return response()->json(['success' => false, 'message' => 'An error occurred.'], 500);
        }
    }
}