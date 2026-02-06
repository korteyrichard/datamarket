<?php

require_once 'vendor/autoload.php';

// Bootstrap Laravel
$app = require_once 'bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\Commission;
use App\Models\ReferralCommission;

echo "=== COMPREHENSIVE COMMISSION ANALYSIS ===\n\n";

// Check what the admin commissions page would show
echo "=== ADMIN COMMISSIONS PAGE DATA ===\n";

// Regular commissions (what should show on admin page)
$commissions = Commission::with(['agent', 'order'])->latest()->get();
echo "Regular Commissions Query Results:\n";
echo "Total Records: " . $commissions->count() . "\n";

foreach ($commissions as $comm) {
    $agentName = $comm->agent ? $comm->agent->name : 'No Agent';
    echo "ID: {$comm->id} | Agent: {$agentName} | Order: {$comm->order_id} | Amount: {$comm->amount} | Status: {$comm->status}\n";
}

echo "\n=== REGULAR COMMISSION TOTALS ===\n";
$totalCommissions = Commission::sum('amount');
$totalAvailableCommissions = Commission::where('status', 'available')->sum('amount');
$totalPendingCommissions = Commission::where('status', 'pending')->sum('amount');
$totalWithdrawnCommissions = Commission::where('status', 'withdrawn')->sum('amount');
$totalPaidCommissions = Commission::where('status', 'paid')->sum('amount');

echo "Total Amount: {$totalCommissions}\n";
echo "Available Amount: {$totalAvailableCommissions}\n";
echo "Pending Amount: {$totalPendingCommissions}\n";
echo "Withdrawn Amount: {$totalWithdrawnCommissions}\n";
echo "Paid Amount: {$totalPaidCommissions}\n";

echo "\n=== REGULAR COMMISSION COUNTS ===\n";
$totalCommissionCount = Commission::count();
$availableCommissionCount = Commission::where('status', 'available')->count();
$pendingCommissionCount = Commission::where('status', 'pending')->count();
$withdrawnCommissionCount = Commission::where('status', 'withdrawn')->count();
$paidCommissionCount = Commission::where('status', 'paid')->count();

echo "Total Count: {$totalCommissionCount}\n";
echo "Available Count: {$availableCommissionCount}\n";
echo "Pending Count: {$pendingCommissionCount}\n";
echo "Withdrawn Count: {$withdrawnCommissionCount}\n";
echo "Paid Count: {$paidCommissionCount}\n";

echo "\n=== REFERRAL COMMISSIONS (SEPARATE TABLE) ===\n";
$referralCommissions = ReferralCommission::with(['referrer'])->latest()->get();
echo "Referral Commissions Query Results:\n";
echo "Total Records: " . $referralCommissions->count() . "\n";

foreach ($referralCommissions as $refComm) {
    $referrerName = $refComm->referrer ? $refComm->referrer->name : 'No Referrer';
    echo "ID: {$refComm->id} | Referrer: {$referrerName} | Commission ID: {$refComm->commission_id} | Amount: {$refComm->amount} | Status: {$refComm->status}\n";
}

echo "\n=== REFERRAL COMMISSION TOTALS ===\n";
$totalReferralCommissions = ReferralCommission::sum('amount');
$availableReferralCommissions = ReferralCommission::where('status', 'available')->sum('amount');
$pendingReferralCommissions = ReferralCommission::where('status', 'pending')->sum('amount');
$withdrawnReferralCommissions = ReferralCommission::where('status', 'withdrawn')->sum('amount');

echo "Total Referral Amount: {$totalReferralCommissions}\n";
echo "Available Referral Amount: {$availableReferralCommissions}\n";
echo "Pending Referral Amount: {$pendingReferralCommissions}\n";
echo "Withdrawn Referral Amount: {$withdrawnReferralCommissions}\n";

echo "\n=== POTENTIAL ISSUES CHECK ===\n";

// Check if there are any records in commissions table that might be referral commissions
$suspiciousCommissions = Commission::whereNotExists(function ($query) {
    $query->select(\DB::raw(1))
          ->from('orders')
          ->whereRaw('orders.id = commissions.order_id');
})->get();

if ($suspiciousCommissions->count() > 0) {
    echo "⚠️  Found " . $suspiciousCommissions->count() . " commissions without valid orders:\n";
    foreach ($suspiciousCommissions as $comm) {
        echo "Commission ID: {$comm->id} | Order ID: {$comm->order_id} | Amount: {$comm->amount}\n";
    }
} else {
    echo "✅ All commissions have valid orders\n";
}

// Check for any commission records that might be duplicated between tables
echo "\n=== CHECKING FOR MIXED DATA ===\n";
$commissionsWithReferrals = Commission::whereExists(function ($query) {
    $query->select(\DB::raw(1))
          ->from('referral_commissions')
          ->whereRaw('referral_commissions.commission_id = commissions.id');
})->get();

echo "Regular commissions that have referral commissions: " . $commissionsWithReferrals->count() . "\n";

echo "\n=== WHAT ADMIN PAGE SHOULD SHOW ===\n";
echo "The admin commissions page should ONLY show regular commissions (commissions table)\n";
echo "It should NOT include referral commissions (referral_commissions table)\n";
echo "Regular commissions: {$totalCommissionCount} records, {$totalCommissions} total amount\n";
echo "Available for withdrawal: {$availableCommissionCount} records, {$totalAvailableCommissions} amount\n";

echo "\n=== ANALYSIS COMPLETE ===\n";