<?php

namespace App\Services;

use App\Models\Order;
use App\Models\Setting;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class CodeCraftMtnOrderPusherService
{
    private $apiKey;
    private $baseUrl = 'https://api.codecraftnetwork.com/api';

    public function __construct()
    {
        $this->apiKey = config('services.codecraft.api_key');
    }

    public function pushOrderToApi(Order $order)
    {
        $apiEnabled = Setting::get('codecraft_mtn_api_enabled', 'true') === 'true';

        if (!$apiEnabled) {
            Log::info('CodeCraft MTN API is disabled, skipping order push', ['order_id' => $order->id]);
            $order->update(['api_status' => 'disabled']);
            return;
        }

        $items = $order->products()->withPivot('quantity', 'price', 'beneficiary_number')->get();

        foreach ($items as $item) {
            $beneficiaryPhone = $item->pivot->beneficiary_number;
            $gig = (int) filter_var($item->pivot->quantity, FILTER_SANITIZE_NUMBER_INT);
            $network = $this->getNetworkFromProduct($item->name);

            if (empty($beneficiaryPhone) || !$network || !$gig) {
                Log::warning('CodeCraft MTN: Missing required order data', [
                    'order_id' => $order->id,
                    'beneficiary' => $beneficiaryPhone,
                    'network' => $network,
                    'gig' => $gig
                ]);
                continue;
            }

            // Determine endpoint: bigtime vs regular
            $isBigTime = stripos($item->name, 'big') !== false;
            $endpoint = $isBigTime
                ? $this->baseUrl . '/special.php'
                : $this->baseUrl . '/initiate.php';

            $payload = [
                'recipient_number' => $this->formatPhone($beneficiaryPhone),
                'gig' => (string) $gig,
                'network' => 'MTN'
            ];

            Log::info('Sending MTN order to CodeCraft API', ['endpoint' => $endpoint, 'payload' => $payload]);

            try {
                $response = Http::timeout(30)
                    ->withHeaders(['x-api-key' => $this->apiKey])
                    ->post($endpoint, $payload);

                $responseData = $response->json();

                Log::info('CodeCraft MTN API Response', [
                    'status_code' => $response->status(),
                    'response' => $responseData
                ]);

                if ($response->status() == 200 && isset($responseData['reference_id'])) {
                    $order->update([
                        'reference_id' => $responseData['reference_id'],
                        'api_status' => 'success'
                    ]);
                    Log::info('MTN order sent to CodeCraft successfully', ['reference_id' => $responseData['reference_id']]);
                } else {
                    $order->update(['api_status' => 'failed']);
                    Log::error('CodeCraft MTN API Error', [
                        'status_code' => $responseData['status'] ?? $response->status(),
                        'message' => $responseData['message'] ?? 'Unknown error'
                    ]);
                }
            } catch (\Exception $e) {
                $order->update(['api_status' => 'failed']);
                Log::error('CodeCraft MTN API Exception', ['message' => $e->getMessage()]);
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
