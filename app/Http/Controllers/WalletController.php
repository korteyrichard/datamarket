<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\Transaction;
use App\Models\User;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\DB;

class WalletController extends Controller
{
    public function index()
    {
        return Inertia::render('Dashboard/Wallet', [
            'transactions' => Transaction::where('user_id', auth()->id())
                ->whereIn('type', ['topup', 'credit', 'debit'])
                ->select('id', 'amount', 'status', 'type', 'description', 'reference', 'created_at')
                ->latest()
                ->paginate(10),
        ]);
    }

    public function verifyPayment(Request $request)
    {
        $request->validate([
            'reference' => 'required|string'
        ]);

        $reference = $request->reference;
        $userId = auth()->id();

        $transaction = Transaction::where('reference', $reference)
            ->where('user_id', $userId)
            ->where('type', 'topup')
            ->first();

        if (!$transaction) {
            return response()->json([
                'success' => false,
                'message' => 'Transaction not found'
            ]);
        }

        if ($transaction->status === 'completed') {
            return response()->json([
                'success' => false,
                'message' => 'Transaction already verified'
            ]);
        }

        try {
            $response = Http::withHeaders([
                'Authorization' => 'Bearer ' . config('paystack.secret_key'),
                'Content-Type' => 'application/json',
            ])->get("https://api.paystack.co/transaction/verify/{$reference}");

            $paystackData = $response->json();

            if ($response->successful() && $paystackData['status'] && $paystackData['data']['status'] === 'success') {
                DB::transaction(function () use ($transaction, $userId) {
                    $transaction->update(['status' => 'completed']);
                    $user = User::find($userId);
                    $user->increment('wallet_balance', $transaction->amount);
                });

                return response()->json([
                    'success' => true,
                    'message' => 'Payment verified and balance updated'
                ]);
            } else {
                return response()->json([
                    'success' => false,
                    'message' => 'Payment verification failed'
                ]);
            }
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error verifying payment: ' . $e->getMessage()
            ]);
        }
    }
}

