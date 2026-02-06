<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\Product;
use App\Models\Setting;
use App\Models\Transaction;
use App\Services\OrderPusherService;
use App\Services\CommissionService;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class OrdersController extends Controller
{
    use ApiResponse;
    public function createOrder(Request $request)
    {
        $request->validate([
            'product_id' => 'required|exists:products,id',
            'quantity' => 'required|string|max:10',
            'beneficiary_number' => 'required|string|regex:/^[0-9+\-\s]+$/|max:20',
            'agent_id' => 'nullable|exists:users,id' // Optional agent ID for commission tracking
        ]);

        $user = $request->user();
        
        if (!in_array($user->role, ['agent', 'dealer', 'admin'])) {
            return $this->errorResponse('Only agents, dealers and admins can create orders via API', 403);
        }
        
        // Determine product type based on user role
        $productType = match($user->role) {
            'dealer' => 'dealer_product',
            'agent' => 'agent_product', 
            'admin' => null, // Admin can access all product types
            default => null
        };
        
        $productQuery = Product::where('id', $request->validated()['product_id'])
            ->where('status', '=', 'IN STOCK');
            
        if ($productType) {
            $productQuery->where('product_type', '=', $productType);
        }
        
        $product = $productQuery->first();

        if (!$product) {
            return $this->errorResponse('Product not found, out of stock, or not available for your role', 404);
        }

        // Validate that the product quantity matches the requested quantity
        if ($product->quantity !== $request->quantity) {
            return $this->errorResponse('Product quantity does not match. Available: ' . $product->quantity, 400);
        }

        $totalPrice = $product->price;

        // Check if user has enough wallet balance
        if ($user->wallet_balance < $totalPrice) {
            return $this->errorResponse('Insufficient wallet balance', 400, [
                'required_amount' => $totalPrice,
                'current_balance' => $user->wallet_balance
            ]);
        }

        DB::beginTransaction();
        try {
            // Deduct wallet balance
            $user->wallet_balance = (float) bcsub((string) $user->wallet_balance, (string) $totalPrice, 2);
            $user->save();

            // Create the order
            $order = Order::create([
                'user_id' => $user->id,
                'status' => 'processing',
                'total' => $totalPrice,
                'beneficiary_number' => $request->beneficiary_number,
                'network' => $product->network,
                'agent_id' => $request->agent_id, // Store agent ID if provided
            ]);

            // Attach product to the order
            $order->products()->attach($product->id, [
                'quantity' => 1,
                'price' => $product->price,
                'beneficiary_number' => $request->beneficiary_number,
            ]);

            // Create transaction record
            $transaction = Transaction::create([
                'user_id' => $user->id,
                'order_id' => $order->id,
                'amount' => $totalPrice,
                'status' => 'completed',
                'type' => 'order',
                'description' => 'API Order placed for ' . $product->network . ' - ' . $product->name,
                'reference' => 'API-' . $order->id . '-' . time(),
            ]);

            // Create commission if agent is involved
            if ($request->agent_id) {
                $order->load('agent.agentShop.agentProducts');
                $commissionService = new CommissionService();
                $commissionService->calculateAndCreateCommission($order);
            }

            DB::commit();

            // Push order to external API
            try {
                $orderPusher = new OrderPusherService();
                $orderPusher->pushOrderToApi($order);
            } catch (\Exception $e) {
                Log::error('Failed to push API order to external service', ['error' => $e->getMessage()]);
            }

            // Load order with relationships for response
            $order->load(['products', 'transactions']);

            return $this->successResponse([
                'order' => $order,
                'transaction' => $transaction,
            ], 'Order created successfully', 201);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('API order creation failed', ['error' => $e->getMessage()]);
            
            return $this->errorResponse('Order creation failed: ' . $e->getMessage(), 500);
        }
    }

    public function getOrders(Request $request)
    {
        $user = $request->user();
        
        $orders = Order::with(['products' => function($query) {
            $query->withPivot('quantity', 'price', 'beneficiary_number');
        }, 'transactions'])
        ->where('user_id', $user->id)
        ->latest()
        ->paginate(20);

        return $this->successResponse($orders);
    }

    public function getOrder(Request $request, $id)
    {
        $user = $request->user();
        
        $order = Order::with(['products' => function($query) {
            $query->withPivot('quantity', 'price', 'beneficiary_number');
        }, 'transactions'])
        ->where('user_id', $user->id)
        ->findOrFail($id);

        return $this->successResponse($order);
    }

    public function getProducts(Request $request)
    {
        $user = $request->user();
        
        if (!in_array($user->role, ['agent', 'dealer', 'admin'])) {
            return $this->errorResponse('Only agents, dealers and admins can access products via API', 403);
        }
        
        // Determine product type based on user role
        $productType = match($user->role) {
            'dealer' => 'dealer_product',
            'agent' => 'agent_product',
            'admin' => null, // Admin can access all product types
            default => null
        };
        
        $productsQuery = Product::where('status', '=', 'IN STOCK')
            ->select('id', 'name', 'price', 'network', 'product_type', 'description', 'quantity');
            
        if ($productType) {
            $productsQuery->where('product_type', '=', $productType);
        }
        
        $products = $productsQuery->get();

        return $this->successResponse($products);
    }
}