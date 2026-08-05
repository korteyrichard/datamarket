<?php

namespace App\Services;

use App\Models\Order;
use App\Models\Setting;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class DataFlowOrderPusherService
{
    private $baseUrl = 'https://dataflowghana.com/api/v1';
    private $apiToken;

    public function __construct()
    {
        $this->apiToken = config('services.dataflow.api_token');
    }

    public function pushOrderToApi(Order $order)
    {
        $apiEnabled = Setting::get('dataflow_mtn_api_enabled', 'false') === 'true';

        if (!$apiEnabled) {
            Log::info('DataFlow MTN API is disabled, skipping order push', ['order_id' => $order->id]);
            $order->update(['api_status' => 'disabled']);
            return;
        }

        $items = $order->products()->withPivot('quantity', 'price', 'beneficiary_number')->get();

        foreach ($items as $item) {
            $beneficiaryPhone = $item->pivot->beneficiary_number;
            $size = $item->pivot->quantity . 'GB';
            $network = $this->getNetworkFromProduct($item->name);

            if (empty($beneficiaryPhone) || !$network) {
                Log::warning('DataFlow: Missing required order data', [
                    'order_id' => $order->id,
                    'beneficiary' => $beneficiaryPhone,
                    'network' => $network,
                ]);
                continue;
            }

            $payload = [
                'beneficiary_number' => $this->formatPhone($beneficiaryPhone),
                'network_id' => 9, // MTN
                'size' => $size,
            ];

            Log::info('Sending MTN order to DataFlow API', ['order_id' => $order->id, 'payload' => $payload]);

            try {
                $response = Http::timeout(30)
                    ->withToken($this->apiToken)
                    ->accept('application/json')
                    ->post($this->baseUrl . '/normal-orders', $payload);

                $responseData = $response->json();

                Log::info('DataFlow API Response', [
                    'status_code' => $response->status(),
                    'response' => $responseData,
                ]);

                if ($response->successful() && isset($responseData['order']['reference_id'])) {
                    $order->update([
                        'reference_id' => $responseData['order']['reference_id'],
                        'api_status' => 'success',
                    ]);
                    Log::info('MTN order sent to DataFlow successfully', ['reference_id' => $responseData['order']['reference_id']]);
                } else {
                    $order->update(['api_status' => 'failed']);
                    Log::error('DataFlow API Error', [
                        'order_id' => $order->id,
                        'status_code' => $response->status(),
                        'message' => $responseData['message'] ?? $responseData['error'] ?? 'Unknown error',
                    ]);
                }
            } catch (\Exception $e) {
                $order->update(['api_status' => 'failed']);
                Log::error('DataFlow API Exception', ['order_id' => $order->id, 'message' => $e->getMessage()]);
            }
        }
    }

    private function formatPhone($phone)
    {
        $phone = preg_replace('/[^0-9]/', '', $phone);
        if (strlen($phone) == 9) {
            return '0' . $phone;
        }
        return $phone;
    }

    private function getNetworkFromProduct($productName)
    {
        if (stripos($productName, 'mtn') !== false) {
            return 'MTN';
        }
        return null;
    }
}
