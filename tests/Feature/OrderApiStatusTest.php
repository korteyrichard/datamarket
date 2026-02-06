<?php

namespace Tests\Feature;

use App\Models\Order;
use App\Models\Setting;
use App\Models\User;
use App\Services\OrderPusherService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class OrderApiStatusTest extends TestCase
{
    use RefreshDatabase;

    public function test_order_api_status_is_disabled_when_api_service_is_disabled()
    {
        // Set API as disabled
        Setting::set('api_enabled', 'false');
        
        // Create a user and order
        $user = User::factory()->create();
        $order = Order::create([
            'user_id' => $user->id,
            'total' => 100.00,
            'status' => 'processing',
            'api_status' => 'disabled'
        ]);

        // Create OrderPusherService and push order
        $orderPusher = new OrderPusherService();
        $orderPusher->pushOrderToApi($order);

        // Refresh order from database
        $order->refresh();

        // Assert that API status remains disabled
        $this->assertEquals('disabled', $order->api_status);
    }

    public function test_order_has_default_api_status_disabled()
    {
        $user = User::factory()->create();
        $order = Order::create([
            'user_id' => $user->id,
            'total' => 100.00,
            'status' => 'processing'
        ]);

        $this->assertEquals('disabled', $order->api_status);
    }
}