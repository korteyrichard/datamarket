<?php

namespace App\Services;

use App\Models\Order;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use App\Services\CommissionService;

class OrderStatusSyncService
{
    private $jaybartApiKey;
    private $moolreSmsService;
    private $commissionService;

    public function __construct()
    {
        $this->jaybartApiKey = env('ORDER_PUSHER_API_KEY', '');
        $this->moolreSmsService = new SmsService();
        $this->commissionService = new CommissionService();
    }

    public function syncOrderStatuses()
    {
        $processingOrders = Order::whereIn('status', ['pending', 'processing'])->with('user')->get();
        
        foreach ($processingOrders as $order) {
            try {
                $this->syncJaybartOrderStatus($order);
            } catch (\Exception $e) {
                Log::error('Failed to sync order status', ['orderId' => $order->id, 'error' => $e->getMessage()]);
            }
        }
    }

    private function syncJaybartOrderStatus($order)
    {
        $referenceId = $this->extractReferenceId($order);
        
        Log::info('Jaybart sync attempt', [
            'order_id' => $order->id,
            'reference_id' => $referenceId,
            'order_network' => $order->network,
            'order_status' => $order->status
        ]);
        
        if (!$referenceId) {
            Log::warning('No reference ID found for Jaybart order', ['orderId' => $order->id]);
            return;
        }

        try {
            Log::info('Making Jaybart API call', [
                'order_id' => $order->id,
                'transaction_id' => $referenceId,
                'api_endpoint' => 'https://agent.jaybartservices.com/api/v1/fetch-other-network-transaction'
            ]);
            
            $response = Http::withHeaders([
                'x-api-key' => $this->jaybartApiKey,
                'Accept' => 'application/json',
                'Content-Type' => 'application/json'
            ])->timeout(20)->post('https://agent.jaybartservices.com/api/v1/fetch-other-network-transaction', [
                'transaction_id' => $referenceId
            ]);

            Log::info('Jaybart API response received', [
                'order_id' => $order->id,
                'status_code' => $response->status(),
                'response_body' => $response->body(),
                'is_successful' => $response->successful()
            ]);

            if ($response->successful()) {
                $data = $response->json();
                $externalStatus = '';
                if (isset($data['order_items']) && is_array($data['order_items']) && count($data['order_items']) > 0) {
                    $externalStatus = $data['order_items'][0]['status'] ?? '';
                }
                $newStatus = $this->mapJaybartStatus($externalStatus);
                
                Log::info('Jaybart status mapping', [
                    'order_id' => $order->id,
                    'external_status' => $externalStatus,
                    'mapped_status' => $newStatus,
                    'current_order_status' => $order->status
                ]);
                
                if ($newStatus && $newStatus !== $order->status) {
                    $oldStatus = $order->status;
                    $updateResult = $order->update(['status' => $newStatus]);
                    Log::info('Jaybart order status updated', [
                        'orderId' => $order->id, 
                        'oldStatus' => $oldStatus, 
                        'newStatus' => $newStatus,
                        'update_successful' => $updateResult
                    ]);
                    
                    // Send SMS notification if order is completed
                    if ($newStatus === 'completed' && $order->user && $order->user->phone) {
                        try {
                            $message = "Your order #{$order->id} for {$order->network} data has been completed successfully. Thank you for using DataFraternity!";
                            $smsResult = $this->moolreSmsService->sendSms($order->user->phone, $message);
                            Log::info('SMS notification sent for completed order', [
                                'order_id' => $order->id,
                                'phone' => $order->user->phone,
                                'sms_success' => $smsResult
                            ]);
                        } catch (\Exception $e) {
                            Log::error('Failed to send SMS notification', ['order_id' => $order->id, 'error' => $e->getMessage()]);
                        }
                        
                        // Make commission available when order is completed
                        $this->commissionService->makeCommissionAvailable($order);
                    }
                    
                    // Reverse commission if order is cancelled
                    if ($newStatus === 'cancelled') {
                        $this->commissionService->reverseCommission($order);
                    }
                } else {
                    Log::info('Jaybart order status unchanged', [
                        'order_id' => $order->id,
                        'current_status' => $order->status,
                        'external_status' => $externalStatus,
                        'mapped_status' => $newStatus
                    ]);
                }
            } else {
                Log::warning('Jaybart API call unsuccessful', [
                    'order_id' => $order->id,
                    'status_code' => $response->status(),
                    'response' => $response->body()
                ]);
            }
        } catch (\Exception $e) {
            Log::error('Jaybart status check failed', ['orderId' => $order->id, 'error' => $e->getMessage()]);
        }
    }

    private function extractReferenceId($order)
    {
        return $order->reference_id;
    }

    private function mapJaybartStatus($externalStatus)
    {
        Log::info('Jaybart Status mapping debug', [
            'input_status' => $externalStatus,
            'input_type' => gettype($externalStatus),
            'input_lowercased' => strtolower($externalStatus)
        ]);
        
        $statusMap = [
            'successful' => 'completed',
            'completed' => 'completed',
            'delivered' => 'completed',
            'placed' => 'processing',
            'processing' => 'processing',
            'pending' => 'processing',
            'failed' => 'cancelled',
            'cancelled' => 'cancelled'
        ];

        $lowercaseStatus = strtolower($externalStatus);
        $mappedStatus = $statusMap[$lowercaseStatus] ?? null;
        
        Log::info('Jaybart Status mapping result', [
            'original_status' => $externalStatus,
            'lowercase_status' => $lowercaseStatus,
            'mapped_status' => $mappedStatus,
            'available_mappings' => array_keys($statusMap)
        ]);

        return $mappedStatus;
    }
}