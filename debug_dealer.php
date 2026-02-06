<?php

// Simple debug script to check dealer functionality
require_once 'vendor/autoload.php';

$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Http\Kernel::class);

// Start the application
$app->boot();

// Check database connection
try {
    $pdo = DB::connection()->getPdo();
    echo "✓ Database connected\n";
} catch (Exception $e) {
    echo "✗ Database connection failed: " . $e->getMessage() . "\n";
    exit(1);
}

// Check if there are any dealers
$dealers = DB::table('users')->where('role', 'dealer')->get();
echo "Found " . count($dealers) . " dealers\n";

foreach ($dealers as $dealer) {
    echo "Dealer ID: {$dealer->id}, Name: {$dealer->name}, Email: {$dealer->email}\n";
    
    // Check if dealer has a shop
    $shop = DB::table('agent_shops')->where('user_id', $dealer->id)->first();
    if ($shop) {
        echo "  ✓ Has shop: {$shop->name} (ID: {$shop->id})\n";
        
        // Check products in shop
        $products = DB::table('agent_products')->where('agent_shop_id', $shop->id)->count();
        echo "  Products in shop: {$products}\n";
    } else {
        echo "  ✗ No shop found\n";
    }
}

// Check available products
$availableProducts = DB::table('products')->where('status', 'IN STOCK')->get();
echo "\nAvailable products: " . count($availableProducts) . "\n";

foreach ($availableProducts as $product) {
    echo "  Product ID: {$product->id}, Name: {$product->name}, Price: {$product->price}\n";
}

echo "\nDebug complete.\n";