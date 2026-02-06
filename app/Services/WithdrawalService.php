<?php

namespace App\Services;

use App\Models\Withdrawal;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class WithdrawalService
{
    public function approveWithdrawal(Withdrawal $withdrawal, string $notes = null)
    {
        return DB::transaction(function () use ($withdrawal, $notes) {
            // Update withdrawal status to processing
            $withdrawal->update([
                'status' => 'processing',
                'notes' => $notes,
                'processed_at' => now()
            ]);

            // Mark corresponding commissions as withdrawn
            $this->markCommissionsAsWithdrawn($withdrawal);

            return $withdrawal;
        });
    }

    public function markAsApproved(Withdrawal $withdrawal, string $notes = null)
    {
        $withdrawal->update([
            'status' => 'approved',
            'notes' => $notes,
            'processed_at' => now()
        ]);
        return $withdrawal;
    }

    public function markAsPaid(Withdrawal $withdrawal, string $notes = null)
    {
        $withdrawal->update([
            'status' => 'paid',
            'notes' => $notes,
            'processed_at' => now()
        ]);
        return $withdrawal;
    }

    public function rejectWithdrawal(Withdrawal $withdrawal, string $notes = null)
    {
        $withdrawal->update([
            'status' => 'rejected',
            'notes' => $notes,
            'processed_at' => now()
        ]);

        return $withdrawal;
    }

    private function markCommissionsAsWithdrawn(Withdrawal $withdrawal)
    {
        $agent = $withdrawal->agent;
        $amount = $withdrawal->amount;

        // Mark regular commissions as withdrawn
        $commissions = $agent->commissions()
            ->where('status', 'available')
            ->orderBy('created_at')
            ->get();

        foreach ($commissions as $commission) {
            if ($amount <= 0) break;
            
            if ($commission->amount <= $amount) {
                $commission->update(['status' => 'withdrawn']);
                $amount -= $commission->amount;
            }
        }

        // Mark referral commissions as withdrawn if needed
        if ($amount > 0) {
            $referralCommissions = $agent->referralCommissions()
                ->where('status', 'available')
                ->orderBy('created_at')
                ->get();

            foreach ($referralCommissions as $refCommission) {
                if ($amount <= 0) break;
                
                if ($refCommission->amount <= $amount) {
                    $refCommission->update(['status' => 'withdrawn']);
                    $amount -= $refCommission->amount;
                }
            }
        }
    }

    private function restoreCommissionsToAvailable(Withdrawal $withdrawal)
    {
        $agent = $withdrawal->agent;
        $amount = $withdrawal->amount;

        // Restore regular commissions to available
        $commissions = $agent->commissions()
            ->where('status', 'withdrawn')
            ->orderBy('created_at')
            ->get();

        foreach ($commissions as $commission) {
            if ($amount <= 0) break;
            
            if ($commission->amount <= $amount) {
                $commission->update(['status' => 'available']);
                $amount -= $commission->amount;
            }
        }

        // Restore referral commissions to available if needed
        if ($amount > 0) {
            $referralCommissions = $agent->referralCommissions()
                ->where('status', 'withdrawn')
                ->orderBy('created_at')
                ->get();

            foreach ($referralCommissions as $refCommission) {
                if ($amount <= 0) break;
                
                if ($refCommission->amount <= $amount) {
                    $refCommission->update(['status' => 'available']);
                    $amount -= $refCommission->amount;
                }
            }
        }
    }
}