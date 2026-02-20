<?php

namespace App\Services;

use App\Models\Order;
use App\Models\Setting;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class CodeCraftOrderPusherService
{
    private $apiKey;
    private $baseUrl = 'https://api.codecraftnetwork.com/api';

    public function __construct()
    {
        $this->apiKey = env('CODECRAFT_API_KEY', '260217092600-xcsKzj-rjxVWK-KbZbxE-MRtOB5-1DS|8i');
    }

    public function pushOrderToApi(Order $order)
    {
        // Check if CodeCraft API is enabled
        $apiEnabled = Setting::get('codecraft_api_enabled', 'true') === 'true';
        
        if (!$apiEnabled) {
            Log::info('CodeCraft API is disabled, skipping order push', ['order_id' => $order->id]);
            $order->update(['api_status' => 'disabled']);
            return;
        }
        
        Log::info('Processing order for CodeCraft API push', ['order_id' => $order->id]);
        
        $items = $order->products()->withPivot('quantity', 'price', 'beneficiary_number')->get();
        Log::info('Order has items', ['count' => $items->count()]);
        
        $processedItems = 0;

        foreach ($items as $item) {
            Log::info('Processing item', ['name' => $item->name]);
            
            $beneficiaryPhone = $item->pivot->beneficiary_number;
            // Extract numeric value from quantity (e.g., "2GB" -> 2 or just 2 -> 2)
            $gig = (int)filter_var($item->pivot->quantity, FILTER_SANITIZE_NUMBER_INT);
            $network = $this->getNetworkFromProduct($item->name);
            
            if (empty($beneficiaryPhone) || !$network || !$gig) {
                Log::warning('Missing required order data', [
                    'order_id' => $order->id,
                    'item_id' => $item->id,
                    'beneficiary' => $beneficiaryPhone,
                    'network' => $network,
                    'gig' => $gig
                ]);
                continue;
            }
            
            $processedItems++;

            $endpoint = $this->getEndpoint($network);
            
            $payload = [
                'recipient_number' => $this->formatPhone($beneficiaryPhone),
                'gig' => (string)$gig,
                'network' => str_replace('_BIGTIME', '', $network)
            ];
            
            Log::info('Sending to CodeCraft API', ['endpoint' => $endpoint, 'payload' => $payload]);

            try {
                $response = Http::timeout(30)
                    ->withHeaders(['x-api-key' => $this->apiKey])
                    ->post($endpoint, $payload);
                
                $statusCode = $response->status();
                $responseData = $response->json();
                
                Log::info('CodeCraft API Response', [
                    'status_code' => $statusCode,
                    'response' => $responseData
                ]);

                if ($statusCode == 200 && isset($responseData['reference_id'])) {
                    $updateData = [
                        'reference_id' => $responseData['reference_id'],
                        'api_status' => 'success'
                    ];
                    
                    if ($network === 'AT') {
                        $updateData['status'] = 'completed';
                    }
                    
                    $order->update($updateData);
                    
                    Log::info('Order sent successfully to CodeCraft', ['reference_id' => $responseData['reference_id']]);
                } else {
                    $order->update(['api_status' => 'failed']);
                    $message = $responseData['message'] ?? 'Unknown error';
                    Log::error('CodeCraft API Error', [
                        'status_code' => $statusCode,
                        'message' => $message
                    ]);
                }

            } catch (\Exception $e) {
                $order->update(['api_status' => 'failed']);
                Log::error('CodeCraft API Exception', [
                    'message' => $e->getMessage()
                ]);
            }
        }
        
        if ($processedItems === 0) {
            Log::info('No items were processed for order, keeping status as disabled', ['order_id' => $order->id]);
        }
    }
    
    private function formatPhone($phone)
    {
        $phone = preg_replace('/[^0-9]/', '', $phone);
        
        if (strlen($phone) == 10 && substr($phone, 0, 1) == '0') {
            return $phone;
        }
        
        if (strlen($phone) == 9) {
            return '0' . $phone;
        }
        
        return $phone;
    }
    
    private function getNetworkFromProduct($productName)
    {
        $productName = strtolower($productName);
        
        if (stripos($productName, 'telecel') !== false) {
            return 'TELECEL';
        } elseif (stripos($productName, 'at data') !== false) {
            return 'AT';
        } elseif (stripos($productName, 'at (big packages)') !== false) {
            return 'AT_BIGTIME';
        }
        
        // MTN orders should not be processed by CodeCraft
        if (stripos($productName, 'mtn') !== false) {
            Log::info('MTN order detected, skipping CodeCraft processing', ['product_name' => $productName]);
            return null;
        }
        
        return null;
    }
    
    private function getEndpoint($network)
    {
        if (in_array($network, ['AT_BIGTIME'])) {
            return $this->baseUrl . '/special.php';
        }
        
        return $this->baseUrl . '/initiate.php';
    }
    
    public function checkOrderStatus($referenceId, $isBigTime = false)
    {
        $endpoint = $isBigTime 
            ? $this->baseUrl . '/response_big_time.php'
            : $this->baseUrl . '/response_regular.php';
            
        try {
            $response = Http::timeout(30)
                ->withHeaders(['x-api-key' => $this->apiKey])
                ->get($endpoint, ['reference_id' => $referenceId]);
                
            $responseData = $response->json();
            
            Log::info('Order status check response', [
                'reference_id' => $referenceId,
                'response' => $responseData
            ]);
            
            return $responseData;
            
        } catch (\Exception $e) {
            Log::error('Order status check failed', [
                'reference_id' => $referenceId,
                'error' => $e->getMessage()
            ]);
            
            return null;
        }
    }
}
