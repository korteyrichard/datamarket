<?php

namespace App\Services;

use App\Models\User;
use App\Models\Referral;
use App\Models\ReferralCommission;
use App\Models\Commission;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class ReferralService
{
    private $commissionValidator;
    
    public function __construct(CommissionValidationService $commissionValidator)
    {
        $this->commissionValidator = $commissionValidator;
    }
    
    public function processReferral(string $referralCode, User $newUser): ?User
    {
        // Validate referral code format
        if (!preg_match('/^[A-Z0-9]{8}$/', $referralCode)) {
            return null;
        }
        
        $referrer = User::where('referral_code', $referralCode)->first();
        
        if (!$referrer || $referrer->id === $newUser->id) {
            return null;
        }

        // Check if referral already exists to avoid duplicate entry
        $existingReferral = Referral::where('referrer_id', $referrer->id)
            ->where('referred_id', $newUser->id)
            ->first();

        if (!$existingReferral) {
            Referral::create([
                'referrer_id' => $referrer->id,
                'referred_id' => $newUser->id
            ]);
        }

        return $referrer;
    }

    public function markAsConverted(User $user): void
    {
        Referral::where('referred_id', $user->id)
            ->whereNull('converted_at')
            ->update(['converted_at' => now()]);
    }

    public function createReferralCommission(Commission $commission): void
    {
        $agent = $commission->agent;
        $referral = $agent->referredBy;

        if (!$referral) {
            return;
        }

        $referrer = $referral->referrer;
        $referralCommissionRate = 0.10; // 10% of agent's commission
        $referralAmount = $commission->amount * $referralCommissionRate;

        // Validate commission data
        $commissionData = [
            'referrer_id' => $referrer->id,
            'commission_id' => $commission->id,
            'amount' => $referralAmount,
            'status' => 'pending',
            'type' => 'order_commission',
            'available_at' => $commission->available_at
        ];
        
        $validation = $this->commissionValidator->validateCommissionData($commissionData);
        if (!$validation['valid']) {
            Log::error('Invalid commission data', $validation['errors']);
            return;
        }
        
        if (!$this->commissionValidator->canCreateCommission($referrer->id, 'order_commission')) {
            Log::warning('Commission creation blocked - daily limit reached', ['referrer_id' => $referrer->id]);
            return;
        }

        ReferralCommission::create($commissionData);
    }
    
    public function createAgentUpgradeCommission(int $referrerId, float $amount): bool
    {
        if (!$this->commissionValidator->validateCommissionAmount($amount, 'agent_upgrade')) {
            Log::error('Invalid commission amount', ['amount' => $amount, 'type' => 'agent_upgrade']);
            return false;
        }
        
        if (!$this->commissionValidator->canCreateCommission($referrerId, 'agent_upgrade')) {
            Log::warning('Commission creation blocked - daily limit reached', ['referrer_id' => $referrerId]);
            return false;
        }
        
        $commissionData = [
            'referrer_id' => $referrerId,
            'commission_id' => null,
            'amount' => $amount,
            'status' => 'available',
            'available_at' => now(),
            'type' => 'agent_upgrade'
        ];
        
        $validation = $this->commissionValidator->validateCommissionData($commissionData);
        if (!$validation['valid']) {
            Log::error('Invalid commission data', $validation['errors']);
            return false;
        }
        
        try {
            ReferralCommission::create($commissionData);
            return true;
        } catch (\Exception $e) {
            Log::error('Failed to create referral commission', ['error' => $e->getMessage()]);
            return false;
        }
    }

    public function generateReferralLink(User $user): string
    {
        return $user->getReferralLink();
    }

    public function getReferralStats(User $user): array
    {
        $referrals = $user->referrals()->with('referred')->get();
        $referralCommissions = $user->referralCommissions()->with('commission.order')->get();
        
        return [
            'total_referrals' => $referrals->count(),
            'total_earnings' => $referralCommissions->sum('amount'),
            'available_earnings' => $referralCommissions->where('status', 'available')->sum('amount'),
            'pending_earnings' => $referralCommissions->where('status', 'pending')->sum('amount'),
            'referrals' => $referrals,
            'commissions' => $referralCommissions
        ];
    }
}