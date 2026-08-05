<?php

namespace App\Http\Controllers;

use App\Models\Cart;
use App\Models\Product;
use App\Models\Order;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class CartController extends Controller
{
    public function store(Request $request)
    {
        $request->validate([
            'product_id' => 'required|exists:products,id',
            'quantity' => 'required|string|min:1',
            'beneficiary_number' => 'required|string|max:20',
        ]);

        $user = Auth::user();
        $beneficiaryNumber = $request->beneficiary_number;
        
        // Check if beneficiary number already exists in cart
        $existingCartItem = Cart::where('user_id', $user->id)
            ->where('beneficiary_number', $beneficiaryNumber)
            ->first();
            
        if ($existingCartItem) {
            if ($request->expectsJson()) {
                return response()->json(['success' => false, 'message' => 'An item for this beneficiary number is already in your cart']);
            }
            // For Inertia.js requests, we need to throw a validation exception
            throw \Illuminate\Validation\ValidationException::withMessages([
                'message' => 'An item for this beneficiary number is already in your cart'
            ]);
        }
        
        // Check if there's an existing order with processing status for this beneficiary number
        $processingOrder = Order::where('user_id', $user->id)
            ->where('status', 'processing')
            ->where(function($query) use ($beneficiaryNumber) {
                $query->where('beneficiary_number', $beneficiaryNumber)
                      ->orWhereHas('products', function($q) use ($beneficiaryNumber) {
                          $q->where('order_product.beneficiary_number', $beneficiaryNumber);
                      });
            })
            ->first();
            
        if ($processingOrder) {
            if ($request->expectsJson()) {
                return response()->json(['success' => false, 'message' => 'There is already an order to the same beneficiary number with status processing']);
            }
            // For Inertia.js requests, we need to throw a validation exception
            throw \Illuminate\Validation\ValidationException::withMessages([
                'message' => 'There is already an order to the same beneficiary number with status processing'
            ]);
        }
        
        $product = Product::findOrFail($request->product_id);
        
        Cart::create([
            'user_id' => $user->id,
            'product_id' => $request->product_id,
            'quantity' => $request->quantity,
            'beneficiary_number' => $beneficiaryNumber,
            'price' => $product->price,
        ]);

        if ($request->expectsJson()) {
            return response()->json(['success' => true, 'message' => 'Added to cart']);
        }
        
        return redirect()->back()->with('success', 'Product added to cart!');
    }

    public function bulkStore(Request $request)
    {
        \Log::info('Bulk add to cart - request received', [
            'items_count' => is_array($request->items) ? count($request->items) : 'not array',
            'raw_input' => $request->all(),
        ]);

        try {
            $request->validate([
                'items' => 'required|array|min:1',
                'items.*.product_id' => 'required|exists:products,id',
                'items.*.quantity' => 'required|string|min:1',
                'items.*.beneficiary_number' => 'required|string|max:20',
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            \Log::error('Bulk add to cart - validation failed', ['errors' => $e->errors()]);
            return response()->json([
                'success' => false,
                'added' => 0,
                'errors' => collect($e->errors())->flatten()->toArray(),
                'message' => 'Validation failed: ' . collect($e->errors())->flatten()->implode(', '),
            ], 422);
        }

        $user = Auth::user();
        \Log::info('Bulk add to cart - user', ['user_id' => $user->id, 'role' => $user->role]);

        $added = 0;
        $errors = [];

        // Pre-fetch all needed data in bulk
        $productIds = collect($request->items)->pluck('product_id')->unique();
        $products = Product::whereIn('id', $productIds)->get()->keyBy('id');
        \Log::info('Bulk add to cart - products found', ['requested_ids' => $productIds->toArray(), 'found_ids' => $products->keys()->toArray()]);

        $beneficiaryNumbers = collect($request->items)->pluck('beneficiary_number')->unique();
        $existingInCart = Cart::where('user_id', $user->id)
            ->whereIn('beneficiary_number', $beneficiaryNumbers)
            ->pluck('beneficiary_number')
            ->toArray();

        $processingNumbers = Order::where('user_id', $user->id)
            ->where('status', 'processing')
            ->whereIn('beneficiary_number', $beneficiaryNumbers)
            ->pluck('beneficiary_number')
            ->toArray();

        \Log::info('Bulk add to cart - existing checks', [
            'existing_in_cart' => $existingInCart,
            'processing_numbers' => $processingNumbers,
        ]);

        $inserts = [];
        $now = now();

        foreach ($request->items as $item) {
            $bn = $item['beneficiary_number'];

            if (in_array($bn, $existingInCart)) {
                $errors[] = "$bn: already in cart";
                continue;
            }
            if (in_array($bn, $processingNumbers)) {
                $errors[] = "$bn: processing order exists";
                continue;
            }

            $product = $products->get($item['product_id']);
            if (!$product) {
                $errors[] = "$bn: product not found (id: {$item['product_id']})";
                continue;
            }

            $inserts[] = [
                'user_id' => $user->id,
                'product_id' => $item['product_id'],
                'quantity' => $item['quantity'],
                'beneficiary_number' => $bn,
                'price' => $product->price,
                'created_at' => $now,
                'updated_at' => $now,
            ];
            // Track to prevent duplicates within same batch
            $existingInCart[] = $bn;
            $added++;
        }

        \Log::info('Bulk add to cart - processing result', [
            'to_insert' => count($inserts),
            'errors' => $errors,
        ]);

        if (!empty($inserts)) {
            try {
                Cart::insert($inserts);
                \Log::info('Bulk add to cart - insert successful', ['count' => count($inserts)]);
            } catch (\Exception $e) {
                \Log::error('Bulk add to cart - insert failed', ['error' => $e->getMessage()]);
                return response()->json([
                    'success' => false,
                    'added' => 0,
                    'errors' => ['Database insert failed: ' . $e->getMessage()],
                    'message' => 'Database insert failed',
                ], 500);
            }
        }

        return response()->json([
            'success' => $added > 0,
            'added' => $added,
            'errors' => $errors,
        ]);
    }

    public function index()
    {
        $cartItems = Cart::with('product')->where('user_id', Auth::id())->get();
        return inertia('Dashboard/Cart', [
            'cartItems' => $cartItems,
        ]);
    }

    public function destroy($id)
    {
        $cart = Cart::where('user_id', Auth::id())->where('id', $id)->first();
        
        if (!$cart) {
            abort(404, 'Cart item not found');
        }
        
        $cart->delete();
        return redirect()->back()->with('success', 'Product removed from cart!');
    }

    public function clearAll()
    {
        Cart::where('user_id', Auth::id())->delete();
        return redirect()->back()->with('success', 'Cart cleared!');
    }
}
