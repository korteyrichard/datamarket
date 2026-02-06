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

// Test scenario: Base price 35.5, Dealer price 40, Expected commission 4.5
$product = new MockProduct(35.50);
$cartItem = new MockCartItem(40.00, 1, 2, $product);

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

// Test with problematic values that could cause 28 commission
echo "\n=== TESTING PROBLEMATIC SCENARIOS ===\n";

// Scenario 1: What if price and basePrice are swapped?
$wrongCommission1 = ($basePrice - $price) * $quantity;
echo "If prices were swapped: (" . $basePrice . " - " . $price . ") * " . $quantity . " = " . $wrongCommission1 . "\n";

// Scenario 2: What if quantity is wrong?
$wrongQuantity = 10;
$wrongCommission2 = ($price - $basePrice) * $wrongQuantity;
echo "If quantity was " . $wrongQuantity . ": (" . $price . " - " . $basePrice . ") * " . $wrongQuantity . " = " . $wrongCommission2 . "\n";

// Scenario 3: What if basePrice is wrong (like 12 instead of 35.5)?
$wrongBasePrice = 12.00;
$wrongCommission3 = ($price - $wrongBasePrice) * $quantity;
echo "If base price was " . $wrongBasePrice . ": (" . $price . " - " . $wrongBasePrice . ") * " . $quantity . " = " . $wrongCommission3 . "\n";

// Scenario 4: What if price is wrong (like 63.5 instead of 40)?
$wrongPrice = 63.50;
$wrongCommission4 = ($wrongPrice - $basePrice) * $quantity;
echo "If selling price was " . $wrongPrice . ": (" . $wrongPrice . " - " . $basePrice . ") * " . $quantity . " = " . $wrongCommission4 . "\n";

echo "\n=== CONCLUSION ===\n";
echo "Check which scenario matches your 28 commission result to identify the root cause.\n";