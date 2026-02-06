<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use App\Models\Cart;
use App\Models\User;

// Temporary diagnostic route - remove after fixing the issue
Route::middleware(['auth'])->get('/debug-checkout', function (Request $request) {
    try {
        $user = Auth::user();
        $cartItems = Cart::where('user_id', $user->id)->with('product')->get();
        
        $diagnostics = [
            'timestamp' => now(),
            'user_info' => [
                'id' => $user->id,
                'role' => $user->role,
                'wallet_balance' => $user->wallet_balance,
                'wallet_balance_type' => gettype($user->wallet_balance),
            ],
            'cart_info' => [
                'count' => $cartItems->count(),
                'items' => $cartItems->map(function($item) {
                    return [
                        'id' => $item->id,
                        'product_id' => $item->product_id,
                        'quantity' => $item->quantity,
                        'quantity_type' => gettype($item->quantity),
                        'price' => $item->price,
                        'price_type' => gettype($item->price),
                        'product_price' => $item->product->price ?? null,
                        'product_price_type' => gettype($item->product->price ?? null),
                        'beneficiary_number' => $item->beneficiary_number,
                        'agent_id' => $item->agent_id,
                    ];
                })
            ],
            'calculated_total' => 0,
            'calculation_errors' => []
        ];
        
        // Test total calculation
        try {
            $total = $cartItems->sum(function ($item) use (&$diagnostics) {
                $price = is_numeric($item->price) ? (float) $item->price : 
                        (is_numeric($item->product->price ?? 0) ? (float) $item->product->price : 0);
                $quantity = is_numeric($item->quantity) ? (int) $item->quantity : 1;
                
                if (!is_numeric($item->price) && !is_numeric($item->product->price ?? 0)) {
                    $diagnostics['calculation_errors'][] = "Item {$item->id} has non-numeric prices";
                }
                if (!is_numeric($item->quantity)) {
                    $diagnostics['calculation_errors'][] = "Item {$item->id} has non-numeric quantity: {$item->quantity}";
                }
                
                return $price * $quantity;
            });
            $diagnostics['calculated_total'] = $total;
        } catch (\Exception $e) {
            $diagnostics['calculation_errors'][] = $e->getMessage();
        }
        
        // Test wallet balance comparison
        $diagnostics['wallet_check'] = [
            'has_sufficient_balance' => $user->wallet_balance >= ($diagnostics['calculated_total'] ?? 0),
            'balance_comparison' => [
                'wallet' => $user->wallet_balance,
                'total' => $diagnostics['calculated_total'] ?? 0,
                'difference' => $user->wallet_balance - ($diagnostics['calculated_total'] ?? 0)
            ]
        ];
        
        // Log the diagnostics
        Log::info('Checkout Diagnostics', $diagnostics);
        
        return response()->json($diagnostics, 200, [], JSON_PRETTY_PRINT);
        
    } catch (\Exception $e) {
        $error = [
            'error' => $e->getMessage(),
            'line' => $e->getLine(),
            'file' => $e->getFile(),
            'trace' => $e->getTraceAsString()
        ];
        
        Log::error('Checkout Diagnostics Error', $error);
        return response()->json($error, 500, [], JSON_PRETTY_PRINT);
    }
});