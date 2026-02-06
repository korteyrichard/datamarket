<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use App\Models\Product;
use App\Models\Cart;
use App\Models\Order;
use App\Models\Commission;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Log;

class CommissionCalculationTest extends TestCase
{
    use RefreshDatabase;

    public function test_commission_calculation_with_dealer_markup()
    {
        // Create a regular user (customer)
        $customer = User::factory()->create([
            'role' => 'user',
            'wallet_balance' => 100.00
        ]);

        // Create a dealer/agent
        $dealer = User::factory()->create([
            'role' => 'agent'
        ]);

        // Create a product with base price
        $product = Product::factory()->create([
            'name' => 'MTN 10GB Data',
            'price' => 35.50, // Base price
            'network' => 'MTN'
        ]);

        // Simulate dealer adding item to customer's cart with markup
        $dealerPrice = 40.00; // Dealer's selling price
        $quantity = 1;

        Cart::create([
            'user_id' => $customer->id,
            'product_id' => $product->id,
            'quantity' => $quantity,
            'price' => $dealerPrice, // This should be the dealer's price
            'agent_id' => $dealer->id, // This indicates it's from dealer shop
            'beneficiary_number' => '0241234567'
        ]);

        // Act as the customer and checkout
        $this->actingAs($customer);
        
        // Capture logs to see what's happening
        Log::info('=== COMMISSION TEST START ===');
        Log::info('Product base price: ' . $product->price);
        Log::info('Dealer selling price: ' . $dealerPrice);
        Log::info('Expected commission: ' . ($dealerPrice - $product->price));

        $response = $this->post(route('orders.checkout'));

        // Check if order was created
        $this->assertDatabaseHas('orders', [
            'user_id' => $customer->id,
            'total' => $dealerPrice * $quantity
        ]);

        // Get the created order
        $order = Order::where('user_id', $customer->id)->first();
        $this->assertNotNull($order);

        // Check if commission was created
        $commission = Commission::where('order_id', $order->id)->first();
        
        if ($commission) {
            Log::info('=== COMMISSION DETAILS ===');
            Log::info('Commission amount: ' . $commission->amount);
            Log::info('Agent ID: ' . $commission->agent_id);
            Log::info('Expected amount: ' . (($dealerPrice - $product->price) * $quantity));
            
            // The commission should be (dealer_price - base_price) * quantity
            $expectedCommission = ($dealerPrice - $product->price) * $quantity;
            $this->assertEquals($expectedCommission, $commission->amount, 
                "Commission should be {$expectedCommission} but got {$commission->amount}");
        } else {
            $this->fail('No commission was created for dealer order');
        }

        // Let's also check the order_product pivot table
        $orderProduct = $order->products()->first();
        if ($orderProduct) {
            Log::info('=== ORDER PRODUCT PIVOT ===');
            Log::info('Pivot price: ' . $orderProduct->pivot->price);
            Log::info('Pivot quantity: ' . $orderProduct->pivot->quantity);
            Log::info('Product base price: ' . $orderProduct->price);
        }

        Log::info('=== COMMISSION TEST END ===');
    }

    public function test_debug_cart_item_values()
    {
        // Create test data
        $customer = User::factory()->create(['wallet_balance' => 100.00]);
        $dealer = User::factory()->create(['role' => 'agent']);
        $product = Product::factory()->create(['price' => 35.50]);

        // Create cart item
        $cartItem = Cart::create([
            'user_id' => $customer->id,
            'product_id' => $product->id,
            'quantity' => 1,
            'price' => 40.00,
            'agent_id' => $dealer->id,
            'beneficiary_number' => '0241234567'
        ]);

        // Debug the cart item values
        Log::info('=== CART ITEM DEBUG ===');
        Log::info('Cart item price: ' . $cartItem->price);
        Log::info('Cart item quantity: ' . $cartItem->quantity);
        Log::info('Product base price: ' . $cartItem->product->price);
        Log::info('Agent ID: ' . $cartItem->agent_id);

        // Simulate the commission calculation logic from OrdersController
        $price = (float) $cartItem->price;
        $quantity = is_numeric($cartItem->quantity) ? (int) $cartItem->quantity : 1;
        $basePrice = (float) $cartItem->product->price;
        $commissionAmount = ($price - $basePrice) * $quantity;

        Log::info('=== COMMISSION CALCULATION DEBUG ===');
        Log::info('Price (from cart): ' . $price);
        Log::info('Base price (from product): ' . $basePrice);
        Log::info('Quantity: ' . $quantity);
        Log::info('Commission calculation: (' . $price . ' - ' . $basePrice . ') * ' . $quantity . ' = ' . $commissionAmount);

        $this->assertEquals(4.50, $commissionAmount, 'Commission should be 4.50');
    }
}