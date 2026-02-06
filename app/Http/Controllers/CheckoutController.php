<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\Cart;

class CheckoutController extends Controller
{
    public function index()
    {
        $cartItems = Cart::where('user_id', auth()->id())->with('product')->get();
        $walletBalance = auth()->user()->wallet_balance;

        return Inertia::render('Dashboard/checkout', [
            'cartItems' => $cartItems,
            'walletBalance' => $walletBalance,
        ]);
    }
}
