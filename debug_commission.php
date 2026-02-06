<?php

// Simple debug script without Laravel bootstrap
echo "=== SIMPLE COMMISSION CALCULATION TEST ===\n";

// Simulate the data types and values from your scenario
class MockProduct {
    public $price;
    public function __construct($price) {
        $this->price = $price;
    }
}

class MockCartItem {
    public $price;
    public $quantity;
    public $agent_id;
    public $product;
    
    public function __construct($price, $quantity, $agent_id, $product) {
        $this->price = $price;
        $this->quantity = $quantity;
        $this->agent_id = $agent_id;
        $this->product = $product;
    }
}

echo "=== COMMISSION CALCULATION DEBUG ===\n";

// Create test data manually
$customer = new User([
    'name' => 'Test Customer',
    'email' => 'customer@test.com',
    'wallet_balance' => 100.00,
    'role' => 'user'
]);
$customer->id = 1;

$dealer = new User([
    'name' => 'Test Dealer',
    'email' => 'dealer@test.com',
    'role' => 'agent'
]);
$dealer->id = 2;

$product = new Product([
    'name' => 'MTN 10GB Data',
    'price' => 35.50,
    'network' => 'MTN'
]);
$product->id = 1;

// Create cart item with dealer markup
$cartItem = new Cart([
    'user_id' => $customer->id,
    'product_id' => $product->id,
    'quantity' => 1,
    'price' => 40.00, // Dealer's selling price
    'agent_id' => $dealer->id,
    'beneficiary_number' => '0241234567'
]);

// Set the product relationship manually for testing
$cartItem->setRelation('product', $product);

echo "Cart item price: " . $cartItem->price . "\n";
echo "Cart item quantity: " . $cartItem->quantity . "\n";
echo "Product base price: " . $cartItem->product->price . "\n";
echo "Agent ID: " . $cartItem->agent_id . "\n";

// Simulate the commission calculation logic from OrdersController
$price = (float) $cartItem->price;
$quantity = is_numeric($cartItem->quantity) ? (int) $cartItem->quantity : 1;
$basePrice = (float) $cartItem->product->price;
$commissionAmount = ($price - $basePrice) * $quantity;

echo "\n=== COMMISSION CALCULATION ===\n";
echo "Price (from cart): " . $price . "\n";
echo "Base price (from product): " . $basePrice . "\n";
echo "Quantity: " . $quantity . "\n";
echo "Commission calculation: (" . $price . " - " . $basePrice . ") * " . $quantity . " = " . $commissionAmount . "\n";
echo "Expected commission: 4.50\n";
echo "Actual commission: " . $commissionAmount . "\n";
echo "Match: " . ($commissionAmount == 4.50 ? 'YES' : 'NO') . "\n";

echo "\n=== ANALYSIS ===\n";
if ($commissionAmount != 4.50) {
    echo "ERROR: Commission calculation is incorrect!\n";
    echo "This suggests there might be an issue with how cart prices are stored or retrieved.\n";
} else {
    echo "SUCCESS: Commission calculation is correct.\n";
    echo "The issue might be elsewhere in the order processing flow.\n";
}