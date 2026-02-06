<?php

namespace App\Http\Controllers;

use App\Services\AgentService;
use App\Services\ReferralService;
use App\Rules\UniqueAgentUsername;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\DB;
use App\Models\Transaction;
use App\Models\User;

class DealerUpgradeController extends Controller
{
    private $agentService;
    private $referralService;

    public function __construct(AgentService $agentService, ReferralService $referralService)
    {
        $this->agentService = $agentService;
        $this->referralService = $referralService;
    }

    public function upgrade(Request $request)
    {
        if (!config('agent.enabled') || !config('agent.features.mini_shops')) {
            return back()->withErrors(['message' => 'Dealer system is currently disabled']);
        }

        $user = $request->user();
        
        // Validate based on user role
        $validationRules = [
            'username' => ['required', 'string', 'max:255', 'alpha_dash', new UniqueAgentUsername],
        ];
        
        // Only require referrer_code for customers, not agents
        if ($user->role === 'customer') {
            $validationRules['referrer_code'] = 'nullable|string|max:8|alpha_num';
        }
        
        $request->validate($validationRules);

        // Rate limiting check
        $recentAttempts = Transaction::where('user_id', $user->id)
            ->where('description', 'LIKE', '%dealer upgrade%')
            ->where('created_at', '>', now()->subMinutes(5))
            ->count();
            
        if ($recentAttempts > 0) {
            return back()->withErrors(['message' => 'Please wait before attempting another upgrade']);
        }

        // Set pricing based on user role
        $amount = $user->role === 'agent' ? 3000 : 3000; // 30 GHS for agents, 30 GHS for customers
        $description = $user->role === 'agent' ? 'Agent to dealer upgrade fee' : 'Customer to dealer upgrade fee';
        
        $reference = 'dealer_upgrade_' . time() . '_' . $user->id;

        try {
            $response = Http::withHeaders([
                'Authorization' => 'Bearer ' . config('services.paystack.secret_key'),
                'Content-Type' => 'application/json',
            ])->timeout(30)->post('https://api.paystack.co/transaction/initialize', [
                'email' => $user->email,
                'amount' => $amount,
                'reference' => $reference,
                'callback_url' => route('dealer.upgrade.callback'),
                'metadata' => [
                    'user_id' => $user->id,
                    'username' => $request->username,
                    'referrer_code' => $request->referrer_code ?? null,
                    'type' => 'dealer_upgrade',
                    'original_role' => $user->role
                ]
            ]);

            \Log::info('Paystack response for dealer upgrade', [
                'status' => $response->status(),
                'body' => $response->json()
            ]);

            if ($response->successful()) {
                $data = $response->json();
                return \Inertia\Inertia::location($data['data']['authorization_url']);
            } else {
                \Log::error('Paystack initialization failed for dealer upgrade', [
                    'response' => $response->json(),
                    'status' => $response->status()
                ]);
                return back()->withErrors(['message' => 'Payment initialization failed: ' . ($response->json('message') ?? 'Unknown error')]);
            }
        } catch (\Exception $e) {
            \Log::error('Payment system error for dealer upgrade', ['error' => $e->getMessage()]);
            return back()->withErrors(['message' => 'Payment system error: ' . $e->getMessage()]);
        }
    }

    public function handleCallback(Request $request)
    {
        \Log::info('Dealer upgrade callback hit', [
            'query_params' => $request->query(),
            'all_params' => $request->all()
        ]);
        
        $reference = $request->query('reference');
        
        if (!$reference || !preg_match('/^dealer_upgrade_\d+_\d+$/', $reference)) {
            \Log::error('Invalid dealer upgrade reference format', ['reference' => $reference]);
            return redirect()->route('become-a-dealer')->withErrors(['message' => 'Invalid payment reference']);
        }

        // Check if this transaction was already processed
        $existingTransaction = Transaction::where('reference', $reference)
            ->where('status', 'completed')
            ->first();
        if ($existingTransaction) {
            \Log::info('Dealer upgrade transaction already processed', ['reference' => $reference]);
            // Check if user role was actually updated
            $user = User::find($existingTransaction->user_id);
            if ($user && $user->role === 'dealer') {
                return redirect()->route('dealer.dashboard')->with('success', 'Dealer upgrade already completed!');
            } else {
                \Log::warning('Transaction completed but user role not updated', [
                    'user_id' => $user->id,
                    'current_role' => $user->role
                ]);
                // Force update the role
                $user->update(['role' => 'dealer']);
                auth()->setUser($user->fresh());
                return redirect()->route('dealer.dashboard')->with('success', 'Dealer upgrade completed!');
            }
        }

        try {
            \Log::info('Verifying dealer upgrade payment', ['reference' => $reference]);
            
            $response = Http::withHeaders([
                'Authorization' => 'Bearer ' . config('services.paystack.secret_key'),
            ])->timeout(30)->get("https://api.paystack.co/transaction/verify/{$reference}");

            \Log::info('Paystack dealer upgrade verification response', [
                'status' => $response->status(),
                'body' => $response->json()
            ]);

            if ($response->successful()) {
                $data = $response->json();
                
                if ($data['data']['status'] === 'success') {
                    $metadata = $data['data']['metadata'];
                    $user = User::find($metadata['user_id']);
                    
                    if (!$user) {
                        \Log::error('User not found for dealer upgrade', ['user_id' => $metadata['user_id']]);
                        return redirect()->route('become-a-dealer')->withErrors(['message' => 'User not found']);
                    }

                    // Verify amount matches expected based on original role
                    $expectedAmount = $metadata['original_role'] === 'agent' ? 3000 : 3000;
                    if ($data['data']['amount'] !== $expectedAmount) {
                        \Log::error('Dealer upgrade amount mismatch', ['expected' => $expectedAmount, 'actual' => $data['data']['amount']]);
                        return redirect()->route('become-a-dealer')->withErrors(['message' => 'Payment amount verification failed']);
                    }

                    \Log::info('Processing dealer upgrade', ['user_id' => $user->id, 'original_role' => $metadata['original_role']]);

                    DB::transaction(function () use ($user, $reference, $metadata, $data) {
                        $actualAmount = $data['data']['amount'] / 100; // Convert from kobo
                        $description = $metadata['original_role'] === 'agent' ? 'Agent to dealer upgrade fee' : 'Customer to dealer upgrade fee';
                        
                        \Log::info('Before role update', ['user_id' => $user->id, 'current_role' => $user->role]);
                        
                        // Record the transaction
                        Transaction::create([
                            'user_id' => $user->id,
                            'type' => 'debit',
                            'amount' => $actualAmount,
                            'description' => $description,
                            'reference' => $reference,
                            'status' => 'completed'
                        ]);

                        // Upgrade to dealer
                        $updateResult = $user->update(['role' => 'dealer']);
                        
                        \Log::info('After role update', [
                            'user_id' => $user->id,
                            'update_result' => $updateResult,
                            'fresh_role' => User::find($user->id)->role
                        ]);
                        
                        // Refresh user session to reflect role change
                        auth()->setUser($user->fresh());
                        
                        // Create shop for dealer (don't use upgradeToAgent as it changes role to agent)
                        $shop = $this->agentService->createShopForAgent($user);
                        
                        // Update shop with custom username
                        $shop->update([
                            'name' => $user->business_name ?: $user->name,
                            'username' => $metadata['username']
                        ]);
                        
                        // Handle referral if provided
                        if (!empty($metadata['referrer_code'])) {
                            $referrer = User::where('referral_code', $metadata['referrer_code'])
                                ->whereIn('role', ['agent', 'dealer'])
                                ->first();
                            
                            if ($referrer && $referrer->id !== $user->id) {
                                $this->referralService->processReferral($metadata['referrer_code'], $user);
                            }
                        }
                        
                        // Mark referral as converted
                        $this->referralService->markAsConverted($user);

                        // Create referral commission if there's a referrer (only for customers becoming dealers)
                        if (!empty($metadata['referrer_code']) && $metadata['original_role'] === 'customer') {
                            $referrer = User::where('referral_code', $metadata['referrer_code'])->first();
                            if ($referrer && $referrer->id !== $user->id) {
                                \Log::info('Creating dealer upgrade referral commission', [
                                    'referrer_id' => $referrer->id,
                                    'amount' => 10.00
                                ]);
                                
                                $success = $this->referralService->createAgentUpgradeCommission($referrer->id, 10.00);
                                if (!$success) {
                                    \Log::warning('Failed to create dealer upgrade referral commission', [
                                        'referrer_id' => $referrer->id,
                                        'amount' => 10.00
                                    ]);
                                }
                            }
                        }
                    });

                    \Log::info('Dealer upgrade completed successfully');
                    return redirect()->route('dealer.dashboard')->with('success', 'Successfully upgraded to dealer!');
                } else {
                    \Log::error('Dealer upgrade payment not successful', ['status' => $data['data']['status']]);
                    return redirect()->route('become-a-dealer')->withErrors(['message' => 'Payment verification failed']);
                }
            } else {
                \Log::error('Paystack dealer upgrade verification failed', ['response' => $response->json()]);
                return redirect()->route('become-a-dealer')->withErrors(['message' => 'Payment verification error']);
            }
        } catch (\Exception $e) {
            \Log::error('Dealer upgrade callback exception', ['error' => $e->getMessage(), 'trace' => $e->getTraceAsString()]);
            return redirect()->route('become-a-dealer')->withErrors(['message' => 'Payment verification error: ' . $e->getMessage()]);
        }
    }
}