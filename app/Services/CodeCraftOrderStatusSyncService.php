<?php

namespace App\Services;

use App\Models\Order;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use App\Services\CommissionService;
use App\Services\SmsService;

class CodeCraftOrderStatusSyncService
{
    private $apiKey;
    private $baseUrl = 'https://api.codecraftnetwork.com/api';
    private $smsService;
    private $commissionService;

    public function __construct()
    {
        $this->apiKey = env('CODECRAFT_API_KEY', '');
        $this->smsService = new SmsService();
        $this->commissionService = new CommissionService();
    }

    public function syncOrderStatuses()
    {
        $processingOrders = Order::whereIn('status', ['pending', 'processing'])
            ->whereNotNull('reference_id')
            ->whereIn('network', ['AT Data (Instant)', 'AT (Big Packages)', 'Telecel'])
            ->with('user', 'products')
            ->get();
        
        foreach ($processingOrders as $order) {
            try {
                $this->syncCodeCraftOrderStatus($order);
            } catch (\Exception $e) {
                Log::error('Failed to sync CodeCraft order status', [
                    'order_id' => $order->id,
                    'error' => $e->getMessage()
                ]);
            }
        }
    }

    private function syncCodeCraftOrderStatus($order)
    {
        $referenceId = $order->reference_id;
        
        if (!$referenceId) {
            Log::warning('No reference ID found for CodeCraft order', ['order_id' => $order->id]);
            return;
        }

        $isBigTime = stripos($order->network, 'big packages') !== false;
        $endpoint = $isBigTime 
            ? $this->baseUrl . '/response_big_time.php'
            : $this->baseUrl . '/response_regular.php';

        try {
            Log::info('Checking CodeCraft order status', [
                'order_id' => $order->id,
                'reference_id' => $referenceId,
                'endpoint' => $endpoint,
                'has_api_key' => !empty($this->apiKey)
            ]);

            $response = Http::timeout(30)
                ->withHeaders(['x-api-key' => $this->apiKey])
                ->get($endpoint, ['reference_id' => $referenceId]);

            Log::info('CodeCraft API response', [
                'order_id' => $order->id,
                'status_code' => $response->status(),
                'response_body' => $response->body()
            ]);

            if ($response->successful()) {
                $data = $response->json();
                
                if (isset($data['success']) && $data['success'] && isset($data['data']['order_status'])) {
                    $externalStatus = $data['data']['order_status'];
                    $newStatus = $this->mapCodeCraftStatus($externalStatus);
                    
                    Log::info('CodeCraft status mapping', [
                        'order_id' => $order->id,
                        'external_status' => $externalStatus,
                        'mapped_status' => $newStatus,
                        'current_status' => $order->status
                    ]);
                    
                    if ($newStatus && $newStatus !== $order->status) {
                        $oldStatus = $order->status;
                        $order->update(['status' => $newStatus]);
                        
                        Log::info('CodeCraft order status updated', [
                            'order_id' => $order->id,
                            'old_status' => $oldStatus,
                            'new_status' => $newStatus
                        ]);
                        
                        // Send SMS notification if order is completed
                        if ($newStatus === 'completed' && $order->user && $order->user->phone) {
                            try {
                                $message = "Your order #{$order->id} for {$order->network} data has been completed successfully. Thank you!";
                                $this->smsService->sendSms($order->user->phone, $message);
                                Log::info('SMS sent for completed CodeCraft order', ['order_id' => $order->id]);
                            } catch (\Exception $e) {
                                Log::error('Failed to send SMS', ['order_id' => $order->id, 'error' => $e->getMessage()]);
                            }
                            
                            // Make commission available
                            $this->commissionService->makeCommissionAvailable($order);
                        }
                        
                        // Reverse commission if cancelled
                        if ($newStatus === 'cancelled') {
                            $this->commissionService->reverseCommission($order);
                        }
                    }
                }
            } else {
                Log::warning('CodeCraft API call unsuccessful', [
                    'order_id' => $order->id,
                    'status_code' => $response->status()
                ]);
            }
        } catch (\Exception $e) {
            Log::error('CodeCraft status check failed', [
                'order_id' => $order->id,
                'error' => $e->getMessage()
            ]);
        }
    }

    private function mapCodeCraftStatus($externalStatus)
    {
        $statusMap = [
            'completed' => 'completed',
            'successful' => 'completed',
            'delivered' => 'completed',
            'crediting successful' => 'completed',
            'pending' => 'processing',
            'processing' => 'processing',
            'failed' => 'cancelled',
            'cancelled' => 'cancelled'
        ];

        return $statusMap[strtolower($externalStatus)] ?? null;
    }
}
