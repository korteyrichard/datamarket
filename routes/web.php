<?php

use App\Http\Controllers\CheckoutController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\WalletController;
use App\Http\Controllers\JoinUsController;
use App\Http\Controllers\OrdersController;
use App\Http\Controllers\TransactionsController;
use App\Http\Controllers\CartController;
use App\Http\Controllers\PaymentController;

Route::get('/', function () {
    return Inertia::render('welcome');
})->name('home');

Route::get('/become-a-dealer', function () {
        $user = auth()->user();
        $existingReferral = null;
        
        if ($user) {
            $referral = $user->referredBy;
            if ($referral) {
                $existingReferral = $referral->referrer->referral_code;
            }
        }
        
        return Inertia::render('AgentUpgrade', [
            'existingReferralCode' => $existingReferral,
            'userRole' => $user ? $user->role : null
        ]);
    })->name('become-a-dealer');

// Test dealer route
Route::get('/dealer/dashboard', [\App\Http\Controllers\DealerWebController::class, 'dashboard'])->name('dealer.dashboard')->middleware(['auth', 'verified', 'role:dealer']);

// Dealer routes - Main functionality moved from agents to dealers
Route::middleware(['auth', 'verified', 'role:dealer'])->group(function () {
    Route::get('/dealer/dashboard', [\App\Http\Controllers\DealerWebController::class, 'dashboard'])->name('dealer.dashboard');
    Route::get('/dealer/commissions', [\App\Http\Controllers\DealerWebController::class, 'commissions'])->name('dealer.commissions');
    Route::get('/dealer/withdrawals', [\App\Http\Controllers\WithdrawalController::class, 'index'])->name('dealer.withdrawals');
    Route::post('/dealer/withdrawals', [\App\Http\Controllers\WithdrawalController::class, 'store'])->name('dealer.withdrawals.store');
    Route::get('/dealer/referrals', [\App\Http\Controllers\DealerWebController::class, 'referrals'])->name('dealer.referrals');
    Route::post('/dealer/referrals/generate', [\App\Http\Controllers\DealerWebController::class, 'generateReferralCode'])->name('dealer.referrals.generate');
    
    // Shop management routes
    Route::get('/dealer/shop/create', [\App\Http\Controllers\ShopManagementController::class, 'create'])->name('dealer.shop.create');
    Route::post('/dealer/shop', [\App\Http\Controllers\ShopManagementController::class, 'store'])->name('dealer.shop.store');
    Route::get('/dealer/shop/edit', [\App\Http\Controllers\ShopManagementController::class, 'edit'])->name('dealer.shop.edit');
    Route::put('/dealer/shop', [\App\Http\Controllers\ShopManagementController::class, 'update'])->name('dealer.shop.update');
    
    // Web-based dealer actions (no API key required)
    Route::post('/dealer/withdraw', [\App\Http\Controllers\DealerWebController::class, 'requestWithdrawal'])->name('dealer.withdraw');
    Route::post('/dealer/products', [\App\Http\Controllers\DealerWebController::class, 'addProduct'])->name('dealer.products.add');
    Route::delete('/dealer/products/{product}', [\App\Http\Controllers\DealerWebController::class, 'removeProduct'])->name('dealer.products.remove');
    
    // Debug route for testing
    Route::get('/dealer/debug', function() {
        $user = auth()->user();
        return response()->json([
            'user_id' => $user->id,
            'user_role' => $user->role,
            'has_shop' => $user->agentShop ? true : false,
            'shop_id' => $user->agentShop ? $user->agentShop->id : null,
            'products_count' => \App\Models\Product::count(),
            'available_products' => \App\Models\Product::where('status', 'IN STOCK')->count()
        ]);
    })->name('dealer.debug');
    
    // Test add product route
    Route::post('/dealer/products/test', function(\Illuminate\Http\Request $request) {
        \Log::info('Test add product route hit', $request->all());
        return redirect()->back()->with('success', 'Test route working');
    })->name('dealer.products.test');
});

// Public shop route
Route::get('/shop/{username}', [\App\Http\Controllers\PublicShopController::class, 'show'])->name('public.shop');
Route::post('/shop/purchase', [\App\Http\Controllers\PublicShopController::class, 'purchase'])->name('shop.purchase');
Route::post('/shop/track-order', [\App\Http\Controllers\PublicShopController::class, 'trackOrder'])->name('shop.track.order');
Route::post('/shop/create-order-from-reference', [\App\Http\Controllers\PublicShopController::class, 'createOrderFromReference'])->name('shop.create.order.reference');
Route::get('/agent/order/callback', [\App\Http\Controllers\PublicShopController::class, 'handleOrderCallback'])->name('agent.order.callback');
Route::get('/agent/order/success/{order}', [\App\Http\Controllers\PublicShopController::class, 'orderSuccess'])->name('agent.order.success');

// Admin dealer management routes (formerly agent management)
Route::middleware(['auth', 'verified', 'role:admin'])->group(function () {
    Route::get('/admin/dealers', [\App\Http\Controllers\AdminAgentWebController::class, 'agents'])->name('admin.dealers');
    Route::get('/admin/withdrawals', [\App\Http\Controllers\AdminWithdrawalWebController::class, 'index'])->name('admin.withdrawals');
    Route::post('/admin/withdrawals/{withdrawal}/approve', [\App\Http\Controllers\AdminWithdrawalWebController::class, 'approve'])->name('admin.withdrawals.approve');
    Route::post('/admin/withdrawals/{withdrawal}/reject', [\App\Http\Controllers\AdminWithdrawalWebController::class, 'reject'])->name('admin.withdrawals.reject');
    Route::post('/admin/withdrawals/{withdrawal}/paid', [\App\Http\Controllers\AdminWithdrawalWebController::class, 'markAsPaid'])->name('admin.withdrawals.paid');
    Route::post('/admin/dealers/{agent}/shop/toggle', [\App\Http\Controllers\AdminAgentWebController::class, 'toggleShop'])->name('admin.dealers.toggle');
    Route::get('/admin/dealers/{agent}/commissions', [\App\Http\Controllers\AdminAgentWebController::class, 'agentCommissions'])->name('admin.dealers.commissions');
});

Route::middleware(['auth'])->group(function () {
    Route::post('/become-a-dealer', [\App\Http\Controllers\DealerUpgradeController::class, 'upgrade'])->name('become-a-dealer.upgrade');
});
Route::get('/dealer/upgrade/callback', [\App\Http\Controllers\DealerUpgradeController::class, 'handleCallback'])->name('dealer.upgrade.callback');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');
    Route::get('/dashboard/wallet', [WalletController::class, 'index'])->name('dashboard.wallet');
    Route::get('/dashboard/joinUs', [JoinUsController::class, 'index'])->name('dashboard.joinUs');
    Route::get('/dashboard/orders', [OrdersController::class, 'index'])->name('dashboard.orders');
    Route::get('/dashboard/transactions', [TransactionsController::class, 'index'])->name('dashboard.transactions');
    Route::get('/dashboard/terms', [DashboardController::class, 'terms'])->name('dashboard.terms');
    Route::get('/dashboard/api-docs', [\App\Http\Controllers\ApiDocsController::class, 'index'])->name('dashboard.api-docs');
    Route::post('/api/generate-key', [\App\Http\Controllers\ApiDocsController::class, 'generateApiKey'])->name('api.docs.generate-key');
    
    // Cart routes
    Route::post('/add-to-cart', [CartController::class, 'store'])->name('add.to.cart');
    Route::get('/cart', [CartController::class, 'index'])->name('cart.index');
    Route::delete('/cart/{cart}', [CartController::class, 'destroy'])->name('remove.from.cart');

    // Wallet balance route
    Route::post('/dashboard/wallet/add', [DashboardController::class, 'addToWallet'])->name('dashboard.wallet.add');
    Route::get('/wallet/callback', [DashboardController::class, 'handleWalletCallback'])->name('wallet.callback');
    Route::post('/dashboard/wallet/verify', [WalletController::class, 'verifyPayment'])->name('dashboard.wallet.verify');

    // ❌ REMOVED THE DUPLICATE ADMIN ROUTE FROM HERE
    // Route::get('/admin/dashboard', [\App\Http\Controllers\AdminDashboardController::class, 'index'])->name('admin.dashboard');
});

// Checkout route
Route::middleware(['auth'])->group(function () {
    Route::get('/checkout', [CheckoutController::class, 'index'])->name('checkout.index');
    Route::post('/place_order', [OrdersController::class, 'checkout'])->name('checkout.process');
});

// Admin routes - This is the correct group with role middleware
Route::middleware(['auth', 'verified', 'role:admin'])->name('admin.')->group(function () {
    Route::get('admin/dashboard', [\App\Http\Controllers\AdminDashboardController::class, 'index'])->name('dashboard');
    Route::get('admin/users', [\App\Http\Controllers\AdminDashboardController::class, 'users'])->name('users');
    Route::post('admin/users', [\App\Http\Controllers\AdminDashboardController::class, 'storeUser'])->name('users.store');
    Route::put('admin/users/{user}', [\App\Http\Controllers\AdminDashboardController::class, 'updateUserRole'])->name('users.updateRole');
    Route::delete('admin/users/{user}', [\App\Http\Controllers\AdminDashboardController::class, 'deleteUser'])->name('users.delete');
    Route::post('admin/users/{user}/credit', [\App\Http\Controllers\AdminDashboardController::class, 'creditWallet'])->name('users.credit');
    Route::post('admin/users/{user}/debit', [\App\Http\Controllers\AdminDashboardController::class, 'debitWallet'])->name('users.debit');
    Route::get('admin/products', [\App\Http\Controllers\AdminDashboardController::class, 'products'])->name('products');
    Route::post('admin/products', [\App\Http\Controllers\AdminDashboardController::class, 'storeProduct'])->name('products.store');
    Route::put('admin/products/{product}', [\App\Http\Controllers\AdminDashboardController::class, 'updateProduct'])->name('products.update');
    Route::delete('admin/products/{product}', [\App\Http\Controllers\AdminDashboardController::class, 'deleteProduct'])->name('products.delete');
    Route::get('admin/orders', [\App\Http\Controllers\AdminDashboardController::class, 'orders'])->name('orders');
    Route::delete('admin/orders/{order}', [\App\Http\Controllers\AdminDashboardController::class, 'deleteOrder'])->name('orders.delete');
    Route::put('admin/orders/{order}/status', [\App\Http\Controllers\AdminDashboardController::class, 'updateOrderStatus'])->name('orders.updateStatus');
    Route::put('admin/orders/bulk-status', [\App\Http\Controllers\AdminDashboardController::class, 'bulkUpdateOrderStatus'])->name('orders.bulkUpdateStatus');
    Route::get('admin/transactions', [\App\Http\Controllers\AdminDashboardController::class, 'transactions'])->name('transactions');
    Route::get('admin/users/{user}/transactions', [\App\Http\Controllers\AdminDashboardController::class, 'userTransactions'])->name('users.transactions');
    Route::post('admin/orders/export', [\App\Http\Controllers\AdminDashboardController::class, 'exportOrders'])->name('orders.export');
    Route::post('admin/api/toggle', [\App\Http\Controllers\AdminDashboardController::class, 'toggleApi'])->name('api.toggle');
    Route::get('admin/alerts', [\App\Http\Controllers\AdminDashboardController::class, 'alerts'])->name('alerts');
    Route::post('admin/alerts', [\App\Http\Controllers\AdminDashboardController::class, 'storeAlert'])->name('alerts.store');
    Route::put('admin/alerts/{alert}', [\App\Http\Controllers\AdminDashboardController::class, 'updateAlert'])->name('alerts.update');
    Route::delete('admin/alerts/{alert}', [\App\Http\Controllers\AdminDashboardController::class, 'deleteAlert'])->name('alerts.delete');
    Route::get('admin/commissions', [\App\Http\Controllers\AdminDashboardController::class, 'commissions'])->name('commissions');
    Route::post('admin/referral-commissions/{referralCommission}/available', [\App\Http\Controllers\AdminDashboardController::class, 'makeReferralCommissionAvailable'])->name('referral-commissions.available');
});

// Paystack payment routes
Route::get('/payment', function () {
    return view('payment');
})->name('payment');
Route::post('/payment/initialize', [PaymentController::class, 'initializePayment'])->name('payment.initialize');
Route::get('/payment/callback', [PaymentController::class, 'handleCallback'])->name('payment.callback');
Route::get('/payment/success', function () { return 'Payment Successful!'; })->name('payment.success');
Route::get('/payment/failed', function () { return 'Payment Failed!'; })->name('payment.failed');

require __DIR__.'/settings.php';
require __DIR__.'/auth.php';
require __DIR__.'/debug.php'; // Temporary debug routes