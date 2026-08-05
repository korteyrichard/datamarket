<?php

namespace App\Services;

use App\Models\Order;
use App\Models\Setting;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class DataFlowOrderStatusSyncService
{
    private $baseUrl = 'https://dataflowghana.com/api/v1';
    private $apiToken;
    private $smsService;
    private $commissionService;

    public function __construct()
    {
        $this->apiToken = config('services.dataflow.api_token');
        $this->smsService = new SmsService();
        $this->commissionService = new CommissionService();
    }

    public function syncOrderStatuses()
    {
        if (Setting::get('dataflow_mtn_api_enabled', 'false') !== 'true') {
            return;
        }

        $orders = Order::whereIn('status', ['pending', 'processing'])
            ->whereNotNull('reference_id')
            ->where('api_status', 'success')
            ->where(function ($q) {
                $q->where('network', 'like', '%MTN%');
            })
            ->with('user', 'products')
            ->get();

        foreach ($orders as $order) {
            // Only sync orders that were pushed to DataFlow (numeric reference_id, not starting with API)
            if (!is_numeric($order->reference_id)) {
                continue;
            }

            try {
                $this->syncOrder($order);
            } catch (\Exception $e) {
                Log::error('Failed to sync DataFlow order status', [
                    'order_id' => $order->id,
                    'error' => $e->getMessage()
                ]);
            }
        }
    }

    private function syncOrder($order)
    {
        $referenceId = $order->reference_id;

        try {
            $response = Http::timeout(20)
                ->withToken($this->apiToken)
                ->accept('application/json')
                ->get($this->baseUrl . '/transactions/' . $referenceId);

            Log::info('DataFlow status check', [
                'order_id' => $order->id,
                'reference_id' => $referenceId,
                'status_code' => $response->status(),
                'response' => $response->json()
            ]);

            if ($response->successful()) {
                $data = $response->json();
                $orderData = $data['data'] ?? $data['order'] ?? $data;
                $externalStatus = $orderData['status'] ?? null;

                if (!$externalStatus) return;

                $newStatus = $this->mapStatus($externalStatus);

                if ($newStatus && $newStatus !== $order->status) {
                    $oldStatus = $order->status;
                    $order->update(['status' => $newStatus]);

                    Log::info('DataFlow order status updated', [
                        'order_id' => $order->id,
                        'old' => $oldStatus,
                        'new' => $newStatus
                    ]);

                    if ($newStatus === 'completed' && $order->user && $order->user->phone) {
                        try {
                            $message = "Your order #{$order->id} for {$order->network} data has been completed successfully. Thank you!";
                            $this->smsService->sendSms($order->user->phone, $message);
                        } catch (\Exception $e) {
                            Log::error('Failed to send SMS', ['order_id' => $order->id, 'error' => $e->getMessage()]);
                        }
                        $this->commissionService->makeCommissionAvailable($order);
                    }

                    if ($newStatus === 'cancelled') {
                        $this->commissionService->reverseCommission($order);
                    }
                }
            }
        } catch (\Exception $e) {
            Log::error('DataFlow status check failed', [
                'order_id' => $order->id,
                'error' => $e->getMessage()
            ]);
        }
    }

    private function mapStatus($externalStatus)
    {
        $map = [
            'completed' => 'completed',
            'successful' => 'completed',
            'delivered' => 'completed',
            'pending' => 'processing',
            'processing' => 'processing',
            'failed' => 'cancelled',
            'cancelled' => 'cancelled',
        ];

        return $map[strtolower($externalStatus)] ?? null;
    }
}
