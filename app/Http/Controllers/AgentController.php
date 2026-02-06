<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\Commission;
use App\Models\ReferralCommission;
use App\Services\ReferralService;

class AgentController extends Controller
{
    private $referralService;

    public function __construct(ReferralService $referralService)
    {
        $this->referralService = $referralService;
    }

    public function dashboard(Request $request)
    {
        $user = $request->user();
        
        // Get dealer stats
        $totalCommissions = Commission::where('agent_id', $user->id)->sum('amount');
        $availableCommissions = Commission::where('agent_id', $user->id)
            ->where('status', 'available')->sum('amount');
        $pendingCommissions = Commission::where('agent_id', $user->id)
            ->where('status', 'pending')->sum('amount');
        
        $referralStats = $this->referralService->getReferralStats($user);
        
        return Inertia::render('Dashboard/AgentDashboard', [
            'stats' => [
                'total_commissions' => $totalCommissions,
                'available_commissions' => $availableCommissions,
                'pending_commissions' => $pendingCommissions,
                'total_referrals' => $referralStats['total_referrals'],
                'referral_earnings' => $referralStats['total_earnings']
            ]
        ]);
    }

    public function commissions(Request $request)
    {
        $user = $request->user();
        
        $commissions = Commission::where('agent_id', $user->id)
            ->with(['order'])
            ->orderBy('created_at', 'desc')
            ->paginate(10);
            
        return Inertia::render('Dashboard/AgentCommissions', [
            'commissions' => $commissions
        ]);
    }

    public function referrals(Request $request)
    {
        $user = $request->user();
        $referralStats = $this->referralService->getReferralStats($user);
        
        return Inertia::render('Dashboard/AgentReferrals', [
            'referralStats' => $referralStats,
            'referralLink' => $this->referralService->generateReferralLink($user)
        ]);
    }
}