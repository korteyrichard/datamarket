<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Withdrawal;
use App\Models\Commission;
use App\Models\ReferralCommission;
use Illuminate\Http\Request;
use Inertia\Inertia;

class AdminAgentWebController extends Controller
{
    public function agents(Request $request)
    {
        $dealers = User::where('role', 'dealer')
            ->with(['agentShop'])
            ->withSum('commissions', 'amount')
            ->withSum('referralCommissions', 'amount')
            ->latest()
            ->paginate(50);

        // Calculate total, available and withdrawn commissions for each dealer
        $dealers->getCollection()->transform(function ($dealer) {
            $dealer->total_commissions = ($dealer->commissions_sum_amount ?? 0) + ($dealer->referral_commissions_sum_amount ?? 0);
            
            // Get available commissions (regular + referral)
            $availableCommissions = $dealer->commissions()
                ->where('status', 'available')
                ->sum('amount');
            
            $availableReferralCommissions = $dealer->referralCommissions()
                ->where('status', 'available')
                ->sum('amount');
            
            $dealer->available_commissions = $availableCommissions + $availableReferralCommissions;
            
            // Get withdrawn amount from approved/paid withdrawals
            $dealer->withdrawn_commissions = $dealer->withdrawals()
                ->whereIn('status', ['approved', 'paid'])
                ->sum('amount');
                
            return $dealer;
        });

        return Inertia::render('Admin/Agents', [
            'agents' => $dealers
        ]);
    }

    public function withdrawals(Request $request)
    {
        $withdrawals = Withdrawal::with('agent')
            ->latest()
            ->paginate(20);

        return Inertia::render('Admin/Withdrawals', [
            'withdrawals' => $withdrawals
        ]);
    }

    public function approveWithdrawal(Withdrawal $withdrawal)
    {
        $withdrawal->update(['status' => 'approved']);
        return back()->with('success', 'Withdrawal approved successfully');
    }

    public function rejectWithdrawal(Withdrawal $withdrawal)
    {
        $withdrawal->update(['status' => 'rejected']);
        
        // Refund the amount back to dealer's commission balance
        $withdrawal->agent->increment('commission_balance', $withdrawal->amount);
        
        return back()->with('success', 'Withdrawal rejected and amount refunded');
    }

    public function toggleShop(Request $request, User $agent)
    {
        // Debug logging
        \Log::info('Shop toggle request received', [
            'dealer_id' => $agent->id,
            'request_data' => $request->all(),
            'has_shop' => $agent->agentShop ? true : false
        ]);

        $request->validate([
            'is_active' => 'required|boolean'
        ]);

        if (!$agent->agentShop) {
            \Log::error('Dealer has no shop', ['dealer_id' => $agent->id]);
            return back()->withErrors(['error' => 'Dealer does not have a shop']);
        }

        try {
            $oldStatus = $agent->agentShop->is_active;
            $agent->agentShop->update([
                'is_active' => $request->is_active
            ]);

            \Log::info('Shop status updated', [
                'dealer_id' => $agent->id,
                'old_status' => $oldStatus,
                'new_status' => $request->is_active
            ]);

            $status = $request->is_active ? 'activated' : 'deactivated';
            return back()->with('success', "Shop {$status} successfully");
        } catch (\Exception $e) {
            \Log::error('Failed to update shop status', [
                'dealer_id' => $agent->id,
                'error' => $e->getMessage()
            ]);
            return back()->withErrors(['error' => 'Failed to update shop status']);
        }
    }

    public function agentCommissions(User $agent)
    {
        $commissions = Commission::where('agent_id', $agent->id)
            ->with('order')
            ->latest()
            ->paginate(20);

        return Inertia::render('Admin/AgentCommissions', [
            'agent' => $agent,
            'commissions' => $commissions
        ]);
    }
}