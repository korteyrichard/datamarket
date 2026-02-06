<?php

require_once 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\Commission;
use App\Models\User;

echo "=== COMMISSION CALCULATION FIX TEST ===\n\n";

// Find user with most commissions (likely agent ID 2 based on debug output)
$user = User::find(2);
if (!$user) {
    echo "User not found\n";
    exit;
}

echo "Testing for User: {$user->name} (ID: {$user->id}, Role: {$user->role})\n\n";

// Simulate the OLD way (frontend calculation from paginated data)
$paginatedCommissions = Commission::where('agent_id', $user->id)
    ->with('order')
    ->latest()
    ->take(20) // First 20 records (pagination)
    ->get();

$oldCalculation = $paginatedCommissions->sum('amount');
$oldAvailable = $paginatedCommissions->where('status', 'available')->sum('amount');
$oldToday = $paginatedCommissions->filter(function($c) {
    return date('Y-m-d', strtotime($c->created_at)) === date('Y-m-d');
})->sum('amount');

echo "OLD METHOD (Frontend calculation from paginated data):\n";
echo "  Total Earnings: {$oldCalculation}\n";
echo "  Available Earnings: {$oldAvailable}\n";
echo "  Today's Earnings: {$oldToday}\n";
echo "  Records used: " . $paginatedCommissions->count() . "\n\n";

// Simulate the NEW way (backend calculation from all data)
$totalEarnings = $user->commissions()->sum('amount');
$availableEarnings = $user->commissions()->where('status', 'available')->sum('amount');
$todaysEarnings = $user->commissions()->whereDate('created_at', today())->sum('amount');
$totalOrders = $user->commissions()->count();

echo "NEW METHOD (Backend calculation from all data):\n";
echo "  Total Earnings: {$totalEarnings}\n";
echo "  Available Earnings: {$availableEarnings}\n";
echo "  Today's Earnings: {$todaysEarnings}\n";
echo "  Total Orders: {$totalOrders}\n\n";

echo "DIFFERENCE:\n";
echo "  Total Earnings Difference: " . ($totalEarnings - $oldCalculation) . "\n";
echo "  Available Earnings Difference: " . ($availableEarnings - $oldAvailable) . "\n";
echo "  Today's Earnings Difference: " . ($todaysEarnings - $oldToday) . "\n\n";

// Show commission status breakdown for this user
echo "COMMISSION STATUS BREAKDOWN FOR THIS USER:\n";
$statusBreakdown = Commission::where('agent_id', $user->id)
    ->selectRaw('status, COUNT(*) as count, SUM(amount) as total_amount')
    ->groupBy('status')
    ->get();

foreach ($statusBreakdown as $status) {
    echo "  {$status->status}: {$status->count} commissions, Total: {$status->total_amount}\n";
}

echo "\n=== TEST COMPLETE ===\n";