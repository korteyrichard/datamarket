<?php

use App\Models\User;
use App\Models\Product;
use App\Models\Cart;
use App\Models\Order;
use App\Models\Commission;
use Illuminate\Support\Facades\Log;

test('debug cart item values', function () {
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

    expect($commissionAmount)->toBe(4.50);
})->uses(\Illuminate\Foundation\Testing\RefreshDatabase::class);