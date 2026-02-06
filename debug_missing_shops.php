<?php

require_once 'vendor/autoload.php';

// Bootstrap Laravel
$app = require_once 'bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\User;
use App\Models\AgentShop;

echo "=== CHECKING FOR MISSING SHOPS ===\n\n";

// Get all agents and dealers
$agentsAndDealers = User::whereIn('role', ['agent', 'dealer'])->get();

echo "Total Agents/Dealers: " . $agentsAndDealers->count() . "\n\n";

$missingShops = [];
$hasShops = [];

foreach ($agentsAndDealers as $user) {
    $shop = AgentShop::where('user_id', $user->id)->first();
    
    if (!$shop) {
        $missingShops[] = $user;
        echo "❌ MISSING SHOP: {$user->name} (ID: {$user->id}, Role: {$user->role}, Email: {$user->email})\n";
    } else {
        $hasShops[] = $user;
        echo "✅ HAS SHOP: {$user->name} (ID: {$user->id}, Role: {$user->role}, Shop: {$shop->name})\n";
    }
}

echo "\n=== SUMMARY ===\n";
echo "Users with shops: " . count($hasShops) . "\n";
echo "Users missing shops: " . count($missingShops) . "\n";

if (count($missingShops) > 0) {
    echo "\n=== CREATING MISSING SHOPS ===\n";
    
    foreach ($missingShops as $user) {
        // Generate a unique username if not exists
        $username = strtolower(str_replace(' ', '', $user->name));
        $originalUsername = $username;
        $counter = 1;
        
        // Check if username already exists
        while (AgentShop::where('username', $username)->exists()) {
            $username = $originalUsername . $counter;
            $counter++;
        }
        
        $shop = AgentShop::create([
            'user_id' => $user->id,
            'name' => $user->name . "'s Shop",
            'username' => $username,
            'is_active' => true
        ]);
        
        echo "✅ Created shop for {$user->name}: {$shop->name} (username: {$username})\n";
    }
}

echo "\n=== ANALYSIS COMPLETE ===\n";