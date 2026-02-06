<?php

namespace App\Http\Controllers;

use App\Models\Withdrawal;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class WithdrawalController extends Controller
{
    public function index()
    {
        $user = Auth::user();
        $withdrawals = $user->withdrawals()
            ->latest()
            ->paginate(10);

        // Calculate commission earnings
        $totalCommissions = $user->commissions()->sum('amount');
        $availableCommissions = $user->commissions()->where('status', 'available')->sum('amount');
        $pendingCommissions = $user->commissions()->where('status', 'pending')->sum('amount');
        
        // Calculate referral earnings
        $totalReferralEarnings = $user->referralCommissions()->sum('amount');
        $availableReferralEarnings = $user->referralCommissions()->where('status', 'available')->sum('amount');
        $pendingReferralEarnings = $user->referralCommissions()->where('status', 'pending')->sum('amount');
        
        // Calculate pending withdrawals to subtract from available balance (exclude rejected and paid)
        $pendingWithdrawals = $user->withdrawals()->whereNotIn('status', ['rejected', 'paid'])->sum('requested_amount');
        
        // Calculate totals (subtract pending withdrawals from available)
        $totalAvailableBeforeWithdrawals = $availableCommissions + $availableReferralEarnings;
        $totalAvailable = $totalAvailableBeforeWithdrawals - $pendingWithdrawals;
        $totalEarnings = $totalCommissions + $totalReferralEarnings;

        return Inertia::render('Dashboard/AgentWithdrawals', [
            'withdrawals' => $withdrawals,
            'walletBalance' => max(0, $totalAvailable), // Ensure it doesn't go negative
            'earningsBreakdown' => [
                'total_commissions' => $totalCommissions,
                'available_commissions' => $availableCommissions,
                'pending_commissions' => $pendingCommissions,
                'total_referral_earnings' => $totalReferralEarnings,
                'available_referral_earnings' => $availableReferralEarnings,
                'pending_referral_earnings' => $pendingReferralEarnings,
                'total_available' => max(0, $totalAvailable),
                'total_earnings' => $totalEarnings,
                'pending_withdrawals' => $pendingWithdrawals
            ]
        ]);
    }

    public function store(Request $request)
    {
        \Log::info('Withdrawal request started', [
            'user_id' => $request->user()->id,
            'request_data' => $request->all()
        ]);

        $availableBalance = $request->user()->commissions()->where('status', 'available')->sum('amount') +
                           $request->user()->referralCommissions()->where('status', 'available')->sum('amount');
        
        // Subtract pending withdrawals (exclude rejected and paid)
        $pendingWithdrawals = $request->user()->withdrawals()->whereNotIn('status', ['rejected', 'paid'])->sum('requested_amount');
        $actualAvailable = $availableBalance - $pendingWithdrawals;

        \Log::info('Withdrawal balance calculation', [
            'available_balance' => $availableBalance,
            'pending_withdrawals' => $pendingWithdrawals,
            'actual_available' => $actualAvailable,
            'requested_amount' => $request->amount
        ]);

        $request->validate([
            'amount' => 'required|numeric|min:50|max:' . $actualAvailable,
            'network' => 'required|in:mtn,telecel',
            'mobile_money_account_name' => 'required|string|max:255',
            'mobile_money_number' => 'required|string|max:20',
        ]);

        if ($actualAvailable < 50) {
            \Log::warning('Insufficient balance for withdrawal', [
                'actual_available' => $actualAvailable,
                'user_id' => $request->user()->id
            ]);
            return redirect()->back()->with('error', 'Insufficient available balance after pending withdrawals');
        }

        try {
            \Log::info('Attempting to create withdrawal record', [
                'agent_id' => $request->user()->id,
                'amount' => $request->amount,
                'network' => $request->network,
                'mobile_money_account_name' => $request->mobile_money_account_name,
                'mobile_money_number' => $request->mobile_money_number,
                'status' => 'pending'
            ]);

            $withdrawalData = [
                'agent_id' => $request->user()->id,
                'requested_amount' => $request->amount,
                'amount' => $request->amount, // Will be updated with final amount after fees if needed
                'fee_amount' => 0, // Will be calculated if fees apply
                'payment_method' => 'mobile_money',
                'network' => $request->network,
                'mobile_money_account_name' => $request->mobile_money_account_name,
                'mobile_money_number' => $request->mobile_money_number,
                'status' => 'pending'
            ];

            $withdrawal = Withdrawal::create($withdrawalData);

            \Log::info('Withdrawal created successfully', [
                'withdrawal_id' => $withdrawal->id,
                'amount' => $withdrawal->amount,
                'network' => $withdrawal->network,
                'user_id' => $request->user()->id,
                'withdrawal_data' => $withdrawal->toArray()
            ]);

            return redirect()->back()->with('success', 'Withdrawal request submitted successfully. Payment will be processed on the next working day.');
        } catch (\Exception $e) {
            \Log::error('Withdrawal creation failed', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'user_id' => $request->user()->id,
                'amount' => $request->amount
            ]);
            return redirect()->back()->with('error', 'Failed to submit withdrawal request: ' . $e->getMessage());
        }
    }
}