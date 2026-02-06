<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Models\Commission;
use App\Models\Withdrawal;
use App\Models\Referral;
use App\Models\ReferralCommission;
use App\Services\AgentService;
use App\Services\ReferralService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class DealerWebController extends Controller
{
    private $agentService;
    private $referralService;

    public function __construct(AgentService $agentService, ReferralService $referralService)
    {
        $this->agentService = $agentService;
        $this->referralService = $referralService;
    }

    public function dashboard(Request $request)
    {
        $user = $request->user();
        
        // If dealer doesn't have a shop, redirect to shop creation
        if ($user->role === 'dealer' && !$user->agentShop) {
            return redirect()->route('dealer.shop.create');
        }
        
        if (!$user->agentShop) {
            return redirect()->route('dashboard');
        }
        
        $dashboardData = $this->agentService->getAgentDashboardData($user);
        
        // Show all products for dealers (they replace agents)
        $dealerProducts = $user->agentShop->agentProducts()
            ->with('product')
            ->where('is_active', true)
            ->get();

        $availableProducts = Product::where('status', 'IN STOCK')
            ->where('product_type', 'dealer_product')
            ->whereNotIn('id', $dealerProducts->pluck('product_id'))
            ->get();

        return Inertia::render('Dashboard/AgentDashboard', [
            'dashboardData' => $dashboardData,
            'agentProducts' => $dealerProducts,
            'availableProducts' => $availableProducts,
            'shopUrl' => route('public.shop', ['username' => $user->agentShop->username])
        ]);
    }

    public function commissions(Request $request)
    {
        $user = $request->user();
        
        $commissions = Commission::where('agent_id', $user->id)
            ->with('order')
            ->latest()
            ->paginate(20);

        // Calculate totals from all commissions, not just paginated data
        $totalEarnings = $user->commissions()->sum('amount');
        $availableEarnings = $user->commissions()->where('status', 'available')->sum('amount');
        $todaysEarnings = $user->commissions()
            ->whereDate('created_at', today())
            ->sum('amount');
        $totalOrders = $user->commissions()->count();

        return Inertia::render('Dashboard/AgentCommissions', [
            'commissions' => $commissions,
            'totals' => [
                'total_earnings' => $totalEarnings,
                'available_earnings' => $availableEarnings,
                'todays_earnings' => $todaysEarnings,
                'total_orders' => $totalOrders
            ]
        ]);
    }

    public function withdrawals(Request $request)
    {
        $user = $request->user();
        
        $withdrawals = Withdrawal::where('agent_id', $user->id)
            ->latest()
            ->paginate(20);

        // Calculate earnings breakdown
        $availableCommissions = $user->commissions()->where('status', 'available')->sum('amount');
        $pendingCommissions = $user->commissions()->where('status', 'pending')->sum('amount');
        $totalCommissions = $user->commissions()->sum('amount');
        
        $availableReferralEarnings = $user->referralCommissions()->where('status', 'available')->sum('amount');
        $pendingReferralEarnings = $user->referralCommissions()->where('status', 'pending')->sum('amount');
        $totalReferralEarnings = $user->referralCommissions()->sum('amount');
        
        $paidWithdrawals = $user->withdrawals()->where('status', 'paid')->sum('amount');
        $pendingWithdrawals = $user->withdrawals()->whereIn('status', ['pending', 'approved'])->sum('amount');
        $totalAvailable = ($availableCommissions + $availableReferralEarnings) - $paidWithdrawals - $pendingWithdrawals;

        return Inertia::render('Dashboard/AgentWithdrawals', [
            'withdrawals' => $withdrawals,
            'earningsBreakdown' => [
                'total_commissions' => $totalCommissions,
                'available_commissions' => $availableCommissions,
                'pending_commissions' => $pendingCommissions,
                'total_referral_earnings' => $totalReferralEarnings,
                'available_referral_earnings' => $availableReferralEarnings,
                'pending_referral_earnings' => $pendingReferralEarnings,
                'total_available' => $totalAvailable,
                'total_earnings' => $totalCommissions + $totalReferralEarnings,
                'pending_withdrawals' => $pendingWithdrawals
            ]
        ]);
    }

    public function referrals(Request $request)
    {
        $user = $request->user();
        $stats = $this->referralService->getReferralStats($user);
        $referralLink = $this->referralService->generateReferralLink($user);

        return Inertia::render('Dashboard/AgentReferrals', [
            'referralStats' => [
                'total_referrals' => count($stats['referrals']),
                'total_earnings' => $stats['total_earnings'],
                'available_earnings' => $stats['available_earnings'],
                'pending_earnings' => $stats['pending_earnings'],
                'referrals' => $stats['referrals'],
                'commissions' => $stats['commissions']
            ],
            'referralLink' => $referralLink
        ]);
    }

    public function generateReferralCode(Request $request)
    {
        $user = $request->user();
        $newCode = $user->generateReferralCode();
        
        return redirect()->back()->with('success', 'New referral code generated: ' . $newCode);
    }

    public function addProduct(Request $request)
    {
        \Log::info('Add product request started', [
            'user_id' => $request->user()->id,
            'request_data' => $request->all(),
            'method' => $request->method(),
            'content_type' => $request->header('Content-Type')
        ]);

        try {
            $validated = $request->validate([
                'product_id' => 'required|exists:products,id',
                'agent_price' => 'required|numeric|min:0'
            ]);
            
            \Log::info('Validation passed', $validated);
        } catch (\Illuminate\Validation\ValidationException $e) {
            \Log::error('Validation failed', [
                'errors' => $e->errors(),
                'input' => $request->all()
            ]);
            return redirect()->back()->withErrors($e->errors())->withInput();
        }

        $shop = $request->user()->agentShop;
        \Log::info('Shop check', [
            'shop_exists' => $shop ? true : false,
            'shop_id' => $shop ? $shop->id : null
        ]);
        
        if (!$shop) {
            \Log::error('Dealer shop not found', ['user_id' => $request->user()->id]);
            return redirect()->back()->with('error', 'Dealer shop not found');
        }

        $product = Product::findOrFail($request->product_id);
        \Log::info('Product found', [
            'product_id' => $product->id,
            'product_name' => $product->name,
            'agent_price' => $request->agent_price
        ]);
        
        try {
            $result = $this->agentService->addProductToShop($shop, $product, $request->agent_price);
            \Log::info('Product added successfully', [
                'agent_product_id' => $result->id,
                'shop_id' => $shop->id,
                'product_id' => $product->id
            ]);
            return redirect()->back()->with('success', 'Product added to shop successfully');
        } catch (\Exception $e) {
            \Log::error('Failed to add product', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            return redirect()->back()->with('error', $e->getMessage());
        }
    }

    public function removeProduct(Request $request, Product $product)
    {
        $shop = $request->user()->agentShop;
        if (!$shop) {
            return redirect()->back()->with('error', 'Dealer shop not found');
        }

        try {
            $this->agentService->removeProductFromShop($shop, $product);
            return redirect()->back()->with('success', 'Product removed from shop successfully');
        } catch (\Exception $e) {
            return redirect()->back()->with('error', $e->getMessage());
        }
    }

    public function requestWithdrawal(Request $request)
    {
        $request->validate([
            'amount' => 'required|numeric|min:100'
        ]);

        $availableBalance = $request->user()->commissions()->where('status', 'available')->sum('amount') +
                           $request->user()->referralCommissions()->where('status', 'available')->sum('amount');
        
        // Subtract paid and pending withdrawals
        $paidWithdrawals = $request->user()->withdrawals()->where('status', 'paid')->sum('amount');
        $pendingWithdrawals = $request->user()->withdrawals()->whereIn('status', ['pending', 'approved'])->sum('amount');
        $actualAvailable = $availableBalance - $paidWithdrawals - $pendingWithdrawals;

        if ($request->amount > $actualAvailable) {
            return redirect()->back()->with('error', 'Insufficient available balance');
        }

        try {
            Withdrawal::create([
                'agent_id' => $request->user()->id,
                'requested_amount' => $request->amount,
                'amount' => $request->amount,
                'fee_amount' => 0,
                'status' => 'pending'
            ]);

            return redirect()->back()->with('success', 'Withdrawal request submitted successfully');
        } catch (\Exception $e) {
            return redirect()->back()->with('error', 'Failed to submit withdrawal request');
        }
    }
}