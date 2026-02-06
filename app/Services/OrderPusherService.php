<?php

namespace App\Services;

use App\Models\Order;
use App\Models\Setting;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class OrderPusherService
{
    private $baseUrl;
    private $apiKey;

    public function __construct()
    {
        $this->baseUrl = env('ORDER_PUSHER_BASE_URL', '');
        $this->apiKey = env('ORDER_PUSHER_API_KEY', '');
    }

    public function pushOrderToApi(Order $order)
    {
        // Check if API is enabled
        $apiEnabled = Setting::get('api_enabled', 'true') === 'true';
        
        if (!$apiEnabled) {
            Log::info('API is disabled, skipping order push', ['order_id' => $order->id]);
            $order->update(['api_status' => 'disabled']);
            return;
        }
        
        Log::info('Processing order for API push', ['order_id' => $order->id]);
        
        $items = $order->products()->withPivot('quantity', 'price', 'beneficiary_number')->get();
        Log::info('Order has items', ['count' => $items->count()]);

        foreach ($items as $item) {
            Log::info('Processing item', ['name' => $item->name]);
            
            $beneficiaryPhone = $item->pivot->beneficiary_number;
            $sharedBundle = $item->pivot->quantity * 1000;
            $networkId = $this->getNetworkIdFromProduct($item->name);
            
            Log::info('Item details', [
                'product' => $item->name,
                'beneficiary' => $beneficiaryPhone,
                'bundle' => $sharedBundle,
                'network_id' => $networkId
            ]);

            if (empty($beneficiaryPhone)) {
                Log::warning('No beneficiary phone found for item, skipping');
                continue;
            }

            if (!$networkId || !$sharedBundle) {
                Log::warning('Missing required order data', [
                    'order_id' => $order->id,
                    'item_id' => $item->id
                ]);
                continue;
            }

            $endpoint = $this->baseUrl . '/buy-other-package';
            $payload = [
                'recipient_msisdn' => $this->formatPhone($beneficiaryPhone),
                'network_id' => $networkId,
                'shared_bundle' => $sharedBundle
            ];
            
            Log::info('Sending to API', ['endpoint' => $endpoint, 'payload' => $payload]);

            try {
                $response = Http::withHeaders([
                    'x-api-key' => $this->apiKey,
                    'Accept' => 'application/json',
                    'Content-Type' => 'application/json'
                ])->timeout(30)->post($endpoint, $payload);

                Log::info('API Response', [
                    'status_code' => $response->status(),
                    'body' => $response->body()
                ]);

                // Save transaction ID from response and update API status
                if ($response->successful()) {
                    $responseData = $response->json();
                    Log::info('API Response Data', ['response_data' => $responseData]);
                    
                    // Try multiple possible paths for transaction ID
                    $transactionId = $responseData['transaction_id'] ?? 
                                   $responseData['transaction_code'] ?? 
                                   $responseData['data']['transaction_id'] ?? 
                                   $responseData['data']['transaction_code'] ?? 
                                   $responseData['id'] ?? 
                                   $responseData['data']['id'] ?? 
                                   $responseData['reference'] ?? 
                                   $responseData['data']['reference'] ?? null;
                    
                    if ($transactionId) {
                        $order->update([
                            'reference_id' => $transactionId,
                            'api_status' => 'success'
                        ]);
                        Log::info('Transaction ID saved', [
                            'order_id' => $order->id,
                            'transaction_id' => $transactionId
                        ]);
                    } else {
                        $order->update(['api_status' => 'success']);
                        Log::warning('No transaction ID found in successful response', [
                            'order_id' => $order->id,
                            'response_data' => $responseData
                        ]);
                    }
                } else {
                    $order->update(['api_status' => 'failed']);
                    Log::error('API request failed', [
                        'order_id' => $order->id,
                        'status_code' => $response->status(),
                        'response' => $response->body()
                    ]);
                }

            } catch (\Exception $e) {
                $order->update(['api_status' => 'failed']);
                Log::error('API Error', [
                    'order_id' => $order->id,
                    'message' => $e->getMessage(),
                    'trace' => $e->getTraceAsString()
                ]);
            }
        }
    }
    
    private function formatPhone($phone)
    {
        $phone = preg_replace('/[^0-9]/', '', $phone);
        
        if (strlen($phone) == 10 && substr($phone, 0, 1) == '0') {
            return $phone;
        }
        
        return $phone;
    }
    

    
    private function getNetworkIdFromProduct($productName)
    {
        $productName = strtolower($productName);
        
        if (stripos($productName, 'mtn') !== false) {
            return 3;
        } elseif (stripos($productName, 'telecel') !== false) {
            return 2;
        } elseif (stripos($productName, 'AT Data (Instant)') !== false || stripos($productName, 'airtel') !== false || stripos($productName, 'tigo') !== false) {
            return 1;
        } elseif (stripos($productName, 'AT (Big Packages)') !== false) {
            return 4;
        }
        
        return 3;
    }
}