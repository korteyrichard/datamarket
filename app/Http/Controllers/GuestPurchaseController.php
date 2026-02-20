<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Models\Order;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;
use Inertia\Inertia;
use App\Services\OrderPusherService;
use App\Services\CodeCraftOrderPusherService;

class GuestPurchaseController extends Controller
{
    public function index()
    {
        $products = Product::forCustomers()->inStock()->get();
        
        return Inertia::render('welcome', [
            'products' => $products
        ]);
    }

    public function checkout(Request $request)
    {
        $request->validate([
            'product_id' => 'required|exists:products,id',
            'customer_email' => 'required|email',
            'beneficiary_number' => 'required|string|size:10|regex:/^[0-9]{10}$/',
        ]);

        $product = Product::findOrFail($request->product_id);

        if ($product->status !== 'IN STOCK') {
            return back()->with('error', 'Product is out of stock');
        }

        $reference = 'guest_' . Str::random(16);

        $response = Http::withHeaders([
            'Authorization' => 'Bearer ' . config('paystack.secret_key'),
            'Content-Type' => 'application/json',
        ])->post('https://api.paystack.co/transaction/initialize', [
            'email' => $request->customer_email,
            'amount' => $product->price * 100,
            'callback_url' => route('guest.payment.callback'),
            'reference' => $reference,
            'metadata' => [
                'product_id' => $product->id,
                'customer_email' => $request->customer_email,
                'beneficiary_number' => $request->beneficiary_number,
            ]
        ]);

        if ($response->successful()) {
            return Inertia::location($response->json('data.authorization_url'));
        }

        return back()->with('error', 'Payment initialization failed');
    }

    public function handleCallback(Request $request)
    {
        $reference = $request->reference;

        $response = Http::withHeaders([
            'Authorization' => 'Bearer ' . config('paystack.secret_key'),
        ])->get("https://api.paystack.co/transaction/verify/{$reference}");

        if (!$response->successful() || $response->json('data.status') !== 'success') {
            return redirect()->route('home')->with('error', 'Payment verification failed');
        }

        // Prevent duplicate orders if callback is hit more than once
        $existingOrder = Order::where('paystack_reference', $reference)->first();
        if ($existingOrder) {
            return redirect()->route('guest.order.success', ['order' => $existingOrder->id]);
        }

        $metadata = $response->json('data.metadata');
        $productId = $metadata['product_id'];
        $beneficiaryNumber = $metadata['beneficiary_number'];
        $customerEmail = $metadata['customer_email'];

        $product = Product::findOrFail($productId);

        preg_match('/\d+/', $product->name, $matches);
        $quantity = isset($matches[0]) ? (int)$matches[0] : 1;

        $order = Order::create([
            'user_id' => null,
            'total' => $product->price,
            'status' => 'processing',
            'network' => $product->network,
            'customer_name' => 'Guest',
            'customer_phone' => $beneficiaryNumber,
            'customer_email' => $customerEmail,
            'paystack_reference' => $reference,
        ]);

        $order->products()->attach($product->id, [
            'quantity' => $quantity,
            'price' => $product->price,
            'beneficiary_number' => $beneficiaryNumber,
        ]);

        $network = strtolower($order->network ?? '');

        if (stripos($network, 'mtn') !== false) {
            $orderPusher = new OrderPusherService();
        } else {
            $orderPusher = new CodeCraftOrderPusherService();
        }

        $orderPusher->pushOrderToApi($order);

        return redirect()->route('guest.order.success', ['order' => $order->id]);
    }

    public function orderSuccess($orderId)
    {
        $order = Order::with('products')->findOrFail($orderId);
        
        return Inertia::render('GuestOrderSuccess', [
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
            // First, try to find existing guest order by phone and reference
            $order = Order::where('customer_phone', $request->beneficiary_number)
                         ->where('paystack_reference', $request->paystack_reference)
                         ->select('id', 'status', 'total', 'network', 'customer_email', 'customer_phone', 'created_at')
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
                        'beneficiary_number' => $order->customer_phone,
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
            $paystackService = new \App\Services\PaystackService();
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
            \Illuminate\Support\Facades\Log::error('Order tracking error', [
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
        ]);

        try {
            // Verify payment again to ensure security
            $paystackService = new \App\Services\PaystackService();
            $verification = $paystackService->verifyReference($request->paystack_reference);

            if (!$verification['success']) {
                return response()->json([
                    'success' => false,
                    'message' => $verification['message']
                ]);
            }

            $product = Product::findOrFail($request->product_id);

            if ($product->status !== 'IN STOCK') {
                return response()->json([
                    'success' => false,
                    'message' => 'Product is no longer in stock'
                ]);
            }

            // Verify payment amount matches product price (allow 1 pesewa difference for rounding)
            $expectedAmount = $product->price;
            $paidAmount = $verification['data']['amount'];
            
            if (abs($paidAmount - $expectedAmount) > 0.01) {
                return response()->json([
                    'success' => false,
                    'message' => 'Payment amount does not match product price'
                ]);
            }

            \DB::beginTransaction();

            // Extract GB amount from product name
            preg_match('/\d+/', $product->name, $matches);
            $quantity = isset($matches[0]) ? (int)$matches[0] : 1;

            // Create order
            $order = Order::create([
                'user_id' => null,
                'status' => 'processing',
                'total' => $product->price,
                'beneficiary_number' => $request->beneficiary_number,
                'network' => $product->network,
                'customer_email' => $verification['data']['email'] ?? '',
                'paystack_reference' => $request->paystack_reference,
                'customer_name' => 'Guest',
                'customer_phone' => $request->beneficiary_number,
            ]);

            $order->products()->attach($product->id, [
                'quantity' => $quantity,
                'price' => $product->price,
                'beneficiary_number' => $request->beneficiary_number
            ]);

            \DB::commit();

            // Push order to external API based on network
            try {
                $network = strtolower($order->network ?? '');
                
                if (stripos($network, 'mtn') !== false) {
                    $orderPusher = new OrderPusherService();
                } else {
                    $orderPusher = new CodeCraftOrderPusherService();
                }
                
                $orderPusher->pushOrderToApi($order);
            } catch (\Exception $e) {
                \Illuminate\Support\Facades\Log::error('Failed to push guest order to external API', [
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
            \DB::rollBack();
            
            \Illuminate\Support\Facades\Log::error('Failed to create order from reference', [
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