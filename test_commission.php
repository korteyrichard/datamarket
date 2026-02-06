<?php

require_once 'vendor/autoload.php';

// Bootstrap Laravel
$app = require_once 'bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\Product;
use App\Models\AgentShop;
use App\Models\AgentProduct;
use App\Models\Order;
use App\Services\CommissionService;
use Illuminate\Support\Facades\Log;

echo "=== COMMISSION CALCULATION TEST ===\n";

// Test scenario: base price 9.40, agent price 11.40, expected commission 2.00
$basePrice = 9.40;
$agentPrice = 11.40;
$expectedCommission = 2.00;

echo "Base Price: $basePrice\n";
echo "Agent Price: $agentPrice\n";
echo "Expected Commission: $expectedCommission\n";
echo "Calculation: ($agentPrice - $basePrice) = " . ($agentPrice - $basePrice) . "\n\n";

// Find an existing agent shop for testing
$agentShop = AgentShop::with('user')->first();
if (!$agentShop) {
    echo "No agent shop found for testing\n";
    exit;
}

echo "Using Agent Shop: {$agentShop->name} (ID: {$agentShop->id})\n";
echo "Agent User ID: {$agentShop->user_id}\n\n";

// Find or create a test product
$product = Product::where('price', $basePrice)->first();
if (!$product) {
    echo "No product found with base price $basePrice, creating test product...\n";
    $product = Product::create([
        'name' => 'Test Product for Commission',
        'description' => 'Test product',
        'price' => $basePrice,
        'network' => 'TEST',
        'product_type' => 'agent_product',
        'status' => 'IN STOCK',
        'quantity' => '1GB'
    ]);
    echo "Created test product with ID: {$product->id}\n";
}

echo "Using Product: {$product->name} (ID: {$product->id}, Price: {$product->price})\n\n";

// Find or create agent product with the specified agent price
$agentProduct = AgentProduct::where('agent_shop_id', $agentShop->id)
    ->where('product_id', $product->id)
    ->first();

if (!$agentProduct) {
    echo "Creating agent product with agent price $agentPrice...\n";
    $agentProduct = AgentProduct::create([
        'agent_shop_id' => $agentShop->id,
        'product_id' => $product->id,
        'agent_price' => $agentPrice,
        'is_active' => true
    ]);
} else {
    echo "Updating existing agent product to agent price $agentPrice...\n";
    $agentProduct->update(['agent_price' => $agentPrice]);
}

echo "Agent Product: ID {$agentProduct->id}, Agent Price: {$agentProduct->agent_price}\n\n";

// Create a test order
echo "Creating test order...\n";
$order = Order::create([
    'user_id' => $agentShop->user_id,
    'agent_id' => $agentShop->user_id, // This is crucial for commission calculation
    'status' => 'processing',
    'total' => $agentPrice,
    'beneficiary_number' => '0123456789',
    'network' => $product->network
]);

// Attach product with base price (as fixed in PublicShopController)
$order->products()->attach($product->id, [
    'quantity' => 1,
    'price' => $basePrice, // Store base price in pivot
    'beneficiary_number' => '0123456789'
]);

echo "Created Order ID: {$order->id}\n";
echo "Order Agent ID: {$order->agent_id}\n";
echo "Order Total: {$order->total}\n\n";

// Load relationships for commission calculation
$order->load('agent.agentShop.agentProducts', 'products');

echo "=== TESTING COMMISSION CALCULATION ===\n";

// Test commission calculation
$commissionService = new CommissionService();
$commission = $commissionService->calculateAndCreateCommission($order);

if ($commission) {
    echo "✅ Commission created successfully!\n";
    echo "Commission ID: {$commission->id}\n";
    echo "Commission Amount: {$commission->amount}\n";
    echo "Expected Amount: $expectedCommission\n";
    
    if (abs($commission->amount - $expectedCommission) < 0.01) {
        echo "✅ Commission amount is CORRECT!\n";
    } else {
        echo "❌ Commission amount is INCORRECT!\n";
        echo "Difference: " . ($commission->amount - $expectedCommission) . "\n";
    }
} else {
    echo "❌ No commission was created\n";
}

echo "\n=== TEST COMPLETED ===\n";