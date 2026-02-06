<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use App\Models\Order;
use Carbon\Carbon;

class PaystackService
{
    public function verifyReference(string $reference): array
    {
        try {
            // Basic validation
            if (empty($reference) || strlen($reference) < 10) {
                return [
                    'success' => false,
                    'message' => 'Invalid payment reference format'
                ];
            }

            // Check if reference already used in orders (optimized query)
            if (Order::where('paystack_reference', $reference)->exists()) {
                return [
                    'success' => false,
                    'message' => 'This payment reference has already been used for an order'
                ];
            }

            $response = Http::withHeaders([
                'Authorization' => 'Bearer ' . config('paystack.secret_key'),
            ])->timeout(30)->get("https://api.paystack.co/transaction/verify/{$reference}");

            if (!$response->successful()) {
                Log::warning('Paystack API error', [
                    'reference' => $reference,
                    'status' => $response->status(),
                    'response' => $response->body()
                ]);
                
                return [
                    'success' => false,
                    'message' => 'Failed to verify reference with Paystack'
                ];
            }

            $data = $response->json('data');
            
            if (!$data || $data['status'] !== 'success') {
                return [
                    'success' => false,
                    'message' => 'Payment was not successful or does not exist'
                ];
            }

            // Check if payment is after feature launch date (prevent old reference abuse)
            $featureLaunchDate = Carbon::parse(config('order_recovery.feature_launch_date', '2026-01-17'));
            $paymentDate = Carbon::parse($data['paid_at']);
            
            if ($paymentDate->isBefore($featureLaunchDate)) {
                return [
                    'success' => false,
                    'message' => 'This order cannot be verified. Contact support for any assistance.'
                ];
            }

            // Check if payment is recent (within configured days from feature launch)
            $maxAgeDays = config('order_recovery.max_reference_age_days', 30);
            if ($paymentDate->diffInDays(now()) > $maxAgeDays) {
                return [
                    'success' => false,
                    'message' => "Payment reference is too old. Only payments from the last {$maxAgeDays} days are accepted"
                ];
            }

            return [
                'success' => true,
                'data' => [
                    'reference' => $data['reference'],
                    'amount' => $data['amount'] / 100, // Convert from kobo to naira
                    'email' => $data['customer']['email'] ?? '',
                    'paid_at' => $data['paid_at'],
                    'metadata' => $data['metadata'] ?? []
                ]
            ];

        } catch (\Exception $e) {
            Log::error('Paystack verification error', [
                'reference' => $reference,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return [
                'success' => false,
                'message' => 'Error verifying payment reference. Please try again later.'
            ];
        }
    }
}