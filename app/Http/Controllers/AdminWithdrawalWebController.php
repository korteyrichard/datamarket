<?php

namespace App\Http\Controllers;

use App\Models\Withdrawal;
use App\Services\WithdrawalService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class AdminWithdrawalWebController extends Controller
{
    protected $withdrawalService;

    public function __construct(WithdrawalService $withdrawalService)
    {
        $this->withdrawalService = $withdrawalService;
    }

    public function index(Request $request)
    {
        $status = $request->get('status', 'all');
        
        $query = Withdrawal::with('agent')->latest();
        
        if ($status !== 'all') {
            $query->where('status', $status);
        }

        $withdrawals = $query->paginate(50);

        return Inertia::render('Admin/Withdrawals', [
            'withdrawals' => $withdrawals,
            'filters' => ['status' => $status]
        ]);
    }

    public function approve(Request $request, Withdrawal $withdrawal)
    {
        $request->validate([
            'notes' => 'nullable|string|max:500'
        ]);

        if ($withdrawal->status === 'pending') {
            $this->withdrawalService->approveWithdrawal($withdrawal, $request->notes);
            return redirect()->back()->with('success', 'Withdrawal moved to processing. Mobile money payment will be processed on the next working day.');
        } elseif ($withdrawal->status === 'processing') {
            $this->withdrawalService->markAsPaid($withdrawal, $request->notes);
            return redirect()->back()->with('success', 'Withdrawal marked as paid successfully.');
        }

        return redirect()->back()->with('error', 'Invalid withdrawal status for this action');
    }

    public function reject(Request $request, Withdrawal $withdrawal)
    {
        $request->validate([
            'notes' => 'required|string|max:500'
        ]);

        if ($withdrawal->status !== 'pending') {
            return redirect()->back()->with('error', 'Only pending withdrawals can be rejected');
        }

        $this->withdrawalService->rejectWithdrawal($withdrawal, $request->notes);

        return redirect()->back()->with('success', 'Withdrawal rejected');
    }

    public function markAsPaid(Request $request, Withdrawal $withdrawal)
    {
        $request->validate([
            'notes' => 'nullable|string|max:500'
        ]);

        if ($withdrawal->status !== 'approved') {
            return redirect()->back()->with('error', 'Only approved withdrawals can be marked as paid');
        }

        $this->withdrawalService->markAsPaid($withdrawal, $request->notes);

        return redirect()->back()->with('success', 'Withdrawal marked as paid successfully');
    }
}