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
}
