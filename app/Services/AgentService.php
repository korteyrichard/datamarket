<?php

namespace App\Services;

use App\Models\User;
use App\Models\AgentShop;
use App\Models\AgentProduct;
use App\Models\Product;
use App\Services\ReferralService;

class AgentService
{
    private $referralService;

    public function __construct(ReferralService $referralService)
    {
        $this->referralService = $referralService;
    }
    public function upgradeToAgent(User $user, array $shopData, $referrerCode = null)
    {
        if ($user->role === 'agent') {
            throw new \Exception('User is already an agent');
        }

        if (AgentShop::where('username', $shopData['username'])->exists()) {
            throw new \Exception('Username already taken');
        }

        $user->update(['role' => 'agent']);

        // Mark referral as converted
        $this->referralService->markAsConverted($user);

        $shop = AgentShop::create([
            'user_id' => $user->id,
            'name' => $shopData['name'],
            'username' => $shopData['username'],
            'is_active' => true
        ]);

        if ($referrerCode) {
            $this->createReferral($user, $referrerCode);
        }

        return $shop;
    }

    public function addProductToShop(AgentShop $shop, Product $product, $agentPrice)
    {
        \Log::info('AgentService addProductToShop called', [
            'shop_id' => $shop->id,
            'product_id' => $product->id,
            'agent_price' => $agentPrice,
            'product_price' => $product->price
        ]);

        if ($agentPrice < $product->price) {
            \Log::error('Agent price validation failed', [
                'agent_price' => $agentPrice,
                'product_price' => $product->price
            ]);
            throw new \Exception('Agent price cannot be less than base price');
        }

        $result = AgentProduct::updateOrCreate(
            [
                'agent_shop_id' => $shop->id,
                'product_id' => $product->id
            ],
            [
                'agent_price' => $agentPrice,
                'is_active' => true
            ]
        );

        \Log::info('AgentProduct created/updated', [
            'agent_product_id' => $result->id,
            'was_recently_created' => $result->wasRecentlyCreated
        ]);

        return $result;
    }

    public function removeProductFromShop(AgentShop $shop, Product $product)
    {
        return AgentProduct::where('agent_shop_id', $shop->id)
            ->where('product_id', $product->id)
            ->delete();
    }

    private function createReferral(User $user, $referrerCode)
    {
        $referrer = User::where('referral_code', $referrerCode)
            ->whereIn('role', ['agent', 'dealer'])
            ->first();

        if ($referrer && $referrer->id !== $user->id) {
            $this->referralService->processReferral($referrerCode, $user);
        }
    }

    public function getAgentDashboardData(User $agent)
    {
        $totalCommissions = $agent->commissions()->sum('amount');
        $totalReferralEarnings = $agent->referralCommissions()->sum('amount');
        $totalEarnings = $totalCommissions + $totalReferralEarnings;
        
        $availableCommissions = $agent->commissions()->where('status', 'available')->sum('amount');
        $availableReferralEarnings = $agent->referralCommissions()->where('status', 'available')->sum('amount');
        $totalAvailable = $availableCommissions + $availableReferralEarnings;
        
        $paidWithdrawals = $agent->withdrawals()->where('status', 'paid')->sum('amount');
        $pendingWithdrawals = $agent->withdrawals()->whereIn('status', ['pending', 'approved'])->sum('amount');
        
        // Available balance = total available earnings - pending withdrawals
        $availableBalance = $totalAvailable - $pendingWithdrawals;
        
        return [
            'total_commissions' => $totalEarnings,
            'total_sales' => $totalCommissions,
            'pending_commissions' => $agent->commissions()->where('status', 'pending')->sum('amount'),
            'available_commissions' => $availableBalance,
            'available_balance' => $availableBalance,
            'withdrawn_balance' => $paidWithdrawals,
            'referral_earnings' => $totalReferralEarnings,
            'total_referrals' => $agent->referrals()->count()
        ];
    }

    public function createShopForAgent(User $user)
    {
        if (!in_array($user->role, ['agent', 'dealer'])) {
            throw new \Exception('Only agents and dealers can have shops');
        }

        if ($user->agentShop) {
            return $user->agentShop;
        }

        $shopName = $user->business_name ?: $user->name;
        $username = strtolower(str_replace(' ', '', $shopName)) . $user->id;

        // Ensure username is unique
        $originalUsername = $username;
        $counter = 1;
        while (AgentShop::where('username', $username)->exists()) {
            $username = $originalUsername . $counter;
            $counter++;
        }

        return AgentShop::create([
            'user_id' => $user->id,
            'name' => $shopName,
            'username' => $username,
            'is_active' => true
        ]);
    }

    public function upgradeToDealer(User $user, array $shopData, $referrerCode = null)
    {
        if ($user->role === 'dealer') {
            throw new \Exception('User is already a dealer');
        }

        if (AgentShop::where('username', $shopData['username'])->exists()) {
            throw new \Exception('Username already taken');
        }

        $user->update(['role' => 'dealer']);

        // Mark referral as converted
        $this->referralService->markAsConverted($user);

        $shop = AgentShop::create([
            'user_id' => $user->id,
            'name' => $shopData['name'],
            'username' => $shopData['username'],
            'is_active' => true
        ]);

        if ($referrerCode) {
            $this->createReferral($user, $referrerCode);
        }

        return $shop;
    }
}