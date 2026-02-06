<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\OrdersController;
use App\Http\Controllers\AgentController;
use App\Http\Controllers\ShopController;
use App\Http\Controllers\AdminController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

// Test route
Route::get('/test', function () {
    return response()->json([
        'success' => true,
        'message' => 'API is working',
        'timestamp' => now()
    ]);
});

// Public routes with rate limiting
Route::middleware('throttle:30,1')->group(function () {
    Route::post('/auth/login', [AuthController::class, 'login']);
    Route::post('/auth/register', [AuthController::class, 'register']);
    
    // Public shop routes
    Route::get('/shop/{username}', [ShopController::class, 'show']);
});

// Protected routes
Route::middleware('api.key.auth')->group(function () {
    // Order routes
    Route::post('/orders', [OrdersController::class, 'createOrder']);
    Route::get('/orders', [OrdersController::class, 'getOrders']);
    Route::get('/orders/{id}', [OrdersController::class, 'getOrder']);
    
    // Product routes
    Route::get('/products', [OrdersController::class, 'getProducts']);
    
    // Agent routes
    Route::post('/agent/upgrade', [AgentController::class, 'upgradeToAgent']);
    Route::post('/agent/products', [AgentController::class, 'addProduct']);
    Route::delete('/agent/products/{product}', [AgentController::class, 'removeProduct']);
    Route::get('/agent/dashboard', [AgentController::class, 'dashboard']);
    Route::post('/agent/withdraw', [AgentController::class, 'requestWithdrawal']);
    Route::get('/agent/commissions', [AgentController::class, 'getCommissions']);
    Route::get('/agent/withdrawals', [AgentController::class, 'getWithdrawals']);
    
    // Referral routes
    Route::post('/referral/generate-link', [\App\Http\Controllers\ReferralController::class, 'generateLink']);
    Route::get('/referral/stats', [\App\Http\Controllers\ReferralController::class, 'getStats']);
    
    // Admin routes
    Route::get('/admin/agents', [AdminController::class, 'getAgents']);
    Route::get('/admin/withdrawals', [AdminController::class, 'getWithdrawals']);
    Route::post('/admin/withdrawals/{withdrawal}/approve', [AdminController::class, 'approveWithdrawal']);
    Route::post('/admin/withdrawals/{withdrawal}/reject', [AdminController::class, 'rejectWithdrawal']);
});