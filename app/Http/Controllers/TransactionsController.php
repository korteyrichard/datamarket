<?php

namespace App\Http\Controllers;
use Illuminate\Http\Request;
use App\Models\Transaction;
use App\Models\Order;
use Illuminate\Support\Facades\Auth;

class TransactionsController extends Controller
{
    /**
     * Display a listing of the transactions.
     */

    public function index(Request $request)
    {
        $user = Auth::user();

        $transactions = Transaction::where('user_id', $user->id)
            ->latest()
            ->get();

        // Calculate today's sales
        $todaysSales = Order::where('user_id', $user->id)
            ->whereDate('created_at', today())
            ->where('status', '!=', 'cancelled')
            ->sum('total');

        // Calculate all-time sales
        $allTimeSales = Order::where('user_id', $user->id)
            ->where('status', '!=', 'cancelled')
            ->sum('total');

        // Calculate today's topups (credit transactions)
        $todaysTopup = Transaction::where('user_id', $user->id)
            ->whereDate('created_at', today())
            ->where('type', 'credit')
            ->sum('amount');

        return inertia('Dashboard/transactions', [
            'transactions' => $transactions,
            'todaysSales' => $todaysSales,
            'allTimeSales' => $allTimeSales,
            'todaysTopup' => $todaysTopup,
        ]);
    }

}
