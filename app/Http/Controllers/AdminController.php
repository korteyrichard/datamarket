<?php

namespace App\Http\Controllers;

use App\Models\Withdrawal;
use App\Models\Commission;
use App\Models\ReferralCommission;
use App\Models\User;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AdminController extends Controller
{
    use ApiResponse;

    public function __construct()
    {
        $this->middleware(function ($request, $next) {
            if (!$request->user() || $request->user()->role !== 'admin') {
                return response()->json(['error' => 'Unauthorized'], 403);
            }
            return $next($request);
        });
    }

    public function getAgents(Request $request)
    {
        $agents = User::where('role', 'agent')
            ->with('agentShop')
            ->latest()
            ->paginate(20);

        return $this->successResponse($agents);
    }

    public function getWithdrawals(Request $request)
    {
        $withdrawals = Withdrawal::with('agent')
            ->latest()
            ->paginate(20);

        return $this->successResponse($withdrawals);
    }

    public function approveWithdrawal(Request $request, Withdrawal $withdrawal)
    {
        if ($withdrawal->status !== 'pending') {
            return $this->errorResponse('Withdrawal is not pending', 400);
        }

        DB::beginTransaction();
        try {
            // Mark commissions as withdrawn
            Commission::where('agent_id', $withdrawal->agent_id)
                ->where('status', 'available')
                ->limit($withdrawal->amount)
                ->update(['status' => 'withdrawn']);

            ReferralCommission::where('referrer_id', $withdrawal->agent_id)
                ->where('status', 'available')
                ->limit($withdrawal->amount)
                ->update(['status' => 'withdrawn']);

            $withdrawal->update([
                'status' => 'approved',
                'processed_at' => now(),
                'notes' => $request->notes
            ]);

            DB::commit();
            return $this->successResponse($withdrawal, 'Withdrawal approved');
        } catch (\Exception $e) {
            DB::rollBack();
            return $this->errorResponse('Failed to approve withdrawal', 500);
        }
    }

    public function rejectWithdrawal(Request $request, Withdrawal $withdrawal)
    {
        if ($withdrawal->status !== 'pending') {
            return $this->errorResponse('Withdrawal is not pending', 400);
        }

        $withdrawal->update([
            'status' => 'rejected',
            'processed_at' => now(),
            'notes' => $request->notes
        ]);

        return $this->successResponse($withdrawal, 'Withdrawal rejected');
    }
}