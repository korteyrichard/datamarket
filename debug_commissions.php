<?php

require_once 'vendor/autoload.php';

// Bootstrap Laravel
$app = require_once 'bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\Commission;
use App\Models\ReferralCommission;

echo "=== COMMISSION DATA ANALYSIS ===\n\n";

// Get all commissions
$allCommissions = Commission::all();
$availableCommissions = Commission::where('status', 'available')->get();
$pendingCommissions = Commission::where('status', 'pending')->get();
$paidCommissions = Commission::where('status', 'paid')->get();

echo "COMMISSION COUNTS:\n";
echo "Total Commissions: " . $allCommissions->count() . "\n";
echo "Available Commissions: " . $availableCommissions->count() . "\n";
echo "Pending Commissions: " . $pendingCommissions->count() . "\n";
echo "Paid Commissions: " . $paidCommissions->count() . "\n\n";

echo "COMMISSION AMOUNTS:\n";
echo "Total Amount: " . $allCommissions->sum('amount') . "\n";
echo "Available Amount: " . $availableCommissions->sum('amount') . "\n";
echo "Pending Amount: " . $pendingCommissions->sum('amount') . "\n";
echo "Paid Amount: " . $paidCommissions->sum('amount') . "\n\n";

echo "COMMISSION STATUS BREAKDOWN:\n";
$statusCounts = Commission::selectRaw('status, COUNT(*) as count, SUM(amount) as total_amount')
    ->groupBy('status')
    ->get();

foreach ($statusCounts as $status) {
    echo "Status: {$status->status} | Count: {$status->count} | Total: {$status->total_amount}\n";
}

echo "\n=== CHECKING FOR DUPLICATES ===\n";
$duplicates = Commission::selectRaw('order_id, agent_id, COUNT(*) as count')
    ->groupBy('order_id', 'agent_id')
    ->having('count', '>', 1)
    ->get();

if ($duplicates->count() > 0) {
    echo "Found " . $duplicates->count() . " duplicate commission groups:\n";
    foreach ($duplicates as $duplicate) {
        echo "Order ID: {$duplicate->order_id}, Agent ID: {$duplicate->agent_id}, Count: {$duplicate->count}\n";
        
        $dupeCommissions = Commission::where('order_id', $duplicate->order_id)
            ->where('agent_id', $duplicate->agent_id)
            ->get();
        
        foreach ($dupeCommissions as $comm) {
            echo "  - Commission ID: {$comm->id}, Amount: {$comm->amount}, Status: {$comm->status}, Created: {$comm->created_at}\n";
        }
    }
} else {
    echo "No duplicate commissions found.\n";
}

echo "\n=== CHECKING REFERRAL COMMISSIONS ===\n";
$referralCommissions = ReferralCommission::all();
echo "Total Referral Commissions: " . $referralCommissions->count() . "\n";
echo "Total Referral Amount: " . $referralCommissions->sum('amount') . "\n";

// Check if referral commissions are being included in main commission totals
$referralStatusCounts = ReferralCommission::selectRaw('status, COUNT(*) as count, SUM(amount) as total_amount')
    ->groupBy('status')
    ->get();

echo "Referral Commission Status Breakdown:\n";
foreach ($referralStatusCounts as $status) {
    echo "Status: {$status->status} | Count: {$status->count} | Total: {$status->total_amount}\n";
}

echo "\n=== RECENT COMMISSIONS (Last 10) ===\n";
$recentCommissions = Commission::with('order')->latest()->take(10)->get();
foreach ($recentCommissions as $comm) {
    echo "ID: {$comm->id} | Order: {$comm->order_id} | Agent: {$comm->agent_id} | Amount: {$comm->amount} | Status: {$comm->status} | Created: {$comm->created_at}\n";
}

echo "\n=== ANALYSIS COMPLETE ===\n";