<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Product;
use App\Models\Order;
use App\Models\Transaction;
use App\Models\Setting;
use App\Models\Alert;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Services\SmsService;

class AdminDashboardController extends Controller
{
    /**
     * Display the admin dashboard.
     */
    public function index()
    {
        $userCount = User::count();
        $productCount = Product::count();
        $orderCount = Order::count();
        $transactionCount = Transaction::count();

        $today = now()->today();
        $todayUserCount = User::whereDate('created_at', $today)->count();
        $todayOrderCount = Order::whereDate('created_at', $today)->count();
        $todayTransactionCount = Transaction::whereDate('created_at', $today)->count();
        
        $todayRevenue = Order::whereDate('created_at', $today)->sum('total') ?: 0;
        $totalRevenue = Order::sum('total') ?: 0;

        return Inertia::render('Admin/Dashboard', [
            'userCount' => $userCount,
            'productCount' => $productCount,
            'orderCount' => $orderCount,
            'transactionCount' => $transactionCount,
            'todayUserCount' => $todayUserCount,
            'todayOrderCount' => $todayOrderCount,
            'todayTransactionCount' => $todayTransactionCount,
            'todayRevenue' => $todayRevenue,
            'totalRevenue' => $totalRevenue,
            'apiEnabled' => Setting::get('api_enabled', 'true') === 'true',
        ]);
    }

    /**
     * Display the admin users page.
     */
    public function users(Request $request)
    {
        $users = User::query();

        // Search by email
        if ($request->has('email') && $request->input('email') !== '') {
            $users->where('email', 'like', '%' . $request->input('email') . '%');
        }

        // Filter by role
        if ($request->has('role') && $request->input('role') !== '') {
            $users->where('role', $request->input('role'));
        }

        // Get user statistics
        $totalUsers = User::count();
        $customerCount = User::where('role', 'customer')->count();
        $agentCount = User::where('role', 'agent')->count();
        $dealerCount = User::where('role', 'dealer')->count();
        $adminCount = User::where('role', 'admin')->count();
        $totalWalletBalance = User::sum('wallet_balance');

        return Inertia::render('Admin/Users', [
            'users' => $users->select('id', 'name', 'email', 'role', 'wallet_balance', 'created_at', 'updated_at')->paginate(15),
            'filterEmail' => $request->input('email', ''),
            'filterRole' => $request->input('role', ''),
            'userStats' => [
                'total' => $totalUsers,
                'customers' => $customerCount,
                'agents' => $agentCount,
                'dealers' => $dealerCount,
                'admins' => $adminCount,
                'totalWalletBalance' => $totalWalletBalance,
            ],
        ]);
    }

    /**
     * Display the admin products page.
     */
    public function products(Request $request)
    {
        $products = Product::query();

        if ($request->has('network') && $request->input('network') !== '') {
            $products->where('network', 'like', '%' . $request->input('network') . '%');
        }

        return Inertia::render('Admin/Products', [
            'products' => $products->get(),
            'filterNetwork' => $request->input('network', ''),
        ]);
    }

    /**
     * Display the admin orders page.
     */
    public function orders(Request $request)
    {
        $orders = Order::with(['products' => function($query) {
            $query->withPivot('quantity', 'price', 'beneficiary_number');
        }, 'user', 'commission'])->select('id', 'user_id', 'agent_id', 'total', 'status', 'api_status', 'created_at', 'network', 'beneficiary_number', 'customer_email', 'paystack_reference')->latest();

        if ($request->has('network') && $request->input('network') !== '') {
            $orders->where('network', 'like', '%' . $request->input('network') . '%');
        }

        if ($request->has('status') && $request->input('status') !== '') {
            $orders->where('status', $request->input('status'));
        }

        // Search by order ID
        if ($request->has('order_id') && $request->input('order_id') !== '') {
            $orders->where('id', $request->input('order_id'));
        }

        // Search by beneficiary number
        if ($request->has('beneficiary_number') && $request->input('beneficiary_number') !== '') {
            $orders->where('beneficiary_number', 'like', '%' . $request->input('beneficiary_number') . '%');
        }

        // Filter by recovered orders (orders with paystack_reference)
        if ($request->has('recovered') && $request->input('recovered') === 'true') {
            $orders->whereNotNull('paystack_reference');
        }

        // Calculate daily totals
        $today = now()->today();
        $dailySales = Order::whereDate('created_at', $today)->sum('total');
        $dailyCommissions = \App\Models\Commission::whereDate('created_at', $today)->sum('amount');
        $recoveredOrdersCount = Order::whereNotNull('paystack_reference')->count();

        return Inertia::render('Admin/Orders', [
            'orders' => $orders->paginate(50),
            'filterNetwork' => $request->input('network', ''),
            'filterStatus' => $request->input('status', ''),
            'searchOrderId' => $request->input('order_id', ''),
            'searchBeneficiaryNumber' => $request->input('beneficiary_number', ''),
            'filterRecovered' => $request->input('recovered', ''),
            'dailySales' => $dailySales,
            'dailyCommissions' => $dailyCommissions,
            'recoveredOrdersCount' => $recoveredOrdersCount
        ]);
    }

    /**
     * Display commissions management page.
     */
    public function commissions(Request $request)
    {
        $commissions = \App\Models\Commission::with(['agent', 'order'])->latest();

        if ($request->has('status') && $request->input('status') !== '') {
            $commissions->where('status', $request->input('status'));
        }

        if ($request->has('agent_id') && $request->input('agent_id') !== '') {
            $commissions->where('agent_id', $request->input('agent_id'));
        }

        // Calculate commission totals (excluding referral commissions)
        $totalCommissions = \App\Models\Commission::sum('amount');
        $totalAvailableCommissions = \App\Models\Commission::where('status', 'available')->sum('amount');
        $totalPendingCommissions = \App\Models\Commission::where('status', 'pending')->sum('amount');
        $totalPaidCommissions = \App\Models\Commission::where('status', 'paid')->sum('amount');
        $totalWithdrawnCommissions = \App\Models\Commission::where('status', 'withdrawn')->sum('amount');
        
        // Get commission counts
        $totalCommissionCount = \App\Models\Commission::count();
        $availableCommissionCount = \App\Models\Commission::where('status', 'available')->count();
        $pendingCommissionCount = \App\Models\Commission::where('status', 'pending')->count();
        $paidCommissionCount = \App\Models\Commission::where('status', 'paid')->count();
        $withdrawnCommissionCount = \App\Models\Commission::where('status', 'withdrawn')->count();

        return Inertia::render('Admin/Commissions', [
            'commissions' => $commissions->paginate(50),
            'filterStatus' => $request->input('status', ''),
            'filterAgentId' => $request->input('agent_id', ''),
            'agents' => User::whereIn('role', ['agent', 'dealer'])->get(['id', 'name', 'email']),
            'totalCommissions' => $totalCommissions,
            'totalAvailableCommissions' => $totalAvailableCommissions,
            'totalPendingCommissions' => $totalPendingCommissions,
            'totalPaidCommissions' => $totalPaidCommissions,
            'totalWithdrawnCommissions' => $totalWithdrawnCommissions,
            'totalCommissionCount' => $totalCommissionCount,
            'availableCommissionCount' => $availableCommissionCount,
            'pendingCommissionCount' => $pendingCommissionCount,
            'paidCommissionCount' => $paidCommissionCount,
            'withdrawnCommissionCount' => $withdrawnCommissionCount
        ]);
    }

    /**
     * Update commission status to available.
     */
    public function makeCommissionAvailable(\App\Models\Commission $commission)
    {
        if ($commission->status !== 'pending') {
            return redirect()->back()->with('error', 'Only pending commissions can be made available');
        }

        $commission->update([
            'status' => 'available',
            'available_at' => now()
        ]);

        // Also update any related referral commissions
        \App\Models\ReferralCommission::where('commission_id', $commission->id)
            ->where('status', 'pending')
            ->update([
                'status' => 'available',
                'available_at' => now()
            ]);

        return redirect()->back()->with('success', 'Commission made available for withdrawal');
    }

    /**
     * Delete an order.
     */
    public function deleteOrder(Order $order)
    {
        $order->delete();
        return redirect()->back()->with('success', 'Order deleted successfully.');
    }

    /**
     * Update an order's status.
     */
    public function updateOrderStatus(Request $request, Order $order)
    {
        $request->validate([
            'status' => 'required|string|in:pending,processing,completed,cancelled',
        ]);

        $oldStatus = $order->status;
        $order->update(['status' => $request->status]);

        // Handle automatic refund when order is cancelled
        if ($request->status === 'cancelled' && $oldStatus !== 'cancelled') {
            $user = $order->user;
            $refundAmount = $order->total;
            
            // Add refund to user's wallet
            $user->increment('wallet_balance', $refundAmount);
            
            // Create refund transaction record
            Transaction::create([
                'user_id' => $user->id,
                'order_id' => $order->id,
                'amount' => $refundAmount,
                'status' => 'completed',
                'type' => 'refund',
                'description' => "Refund for cancelled order #{$order->id}",
            ]);
            
            // Send SMS notification for refund
            if ($user->phone) {
                $smsService = new SmsService();
                $message = "Your order #{$order->id} has been cancelled and GHS " . number_format($refundAmount, 2) . " has been refunded to your wallet.";
                $smsService->sendSms($user->phone, $message);
            }
        }

        // Send SMS if status changed to completed
        if ($request->status === 'completed' && $oldStatus !== 'completed' && $order->user->phone) {
            $smsService = new SmsService();
            $message = "Your order #{$order->id} has been completed. Total: GHS " . number_format($order->total, 2);
            $smsService->sendSms($order->user->phone, $message);
        }

        return redirect()->back()->with('success', 'Order status updated successfully.');
    }

    /**
     * Bulk update order statuses.
     */
    public function bulkUpdateOrderStatus(Request $request)
    {
        $request->validate([
            'order_ids' => 'required|array|min:1',
            'order_ids.*' => 'exists:orders,id',
            'status' => 'required|string|in:pending,processing,completed,cancelled',
        ]);

        // Get orders before update for SMS notifications
        $orders = Order::with('user')->whereIn('id', $request->order_ids)->get();
        
        $updatedCount = Order::whereIn('id', $request->order_ids)
            ->update(['status' => $request->status]);

        // Handle automatic refunds when orders are cancelled
        if ($request->status === 'cancelled') {
            $smsService = new SmsService();
            foreach ($orders as $order) {
                if ($order->status !== 'cancelled') {
                    $user = $order->user;
                    $refundAmount = $order->total;
                    
                    // Add refund to user's wallet
                    $user->increment('wallet_balance', $refundAmount);
                    
                    // Create refund transaction record
                    Transaction::create([
                        'user_id' => $user->id,
                        'order_id' => $order->id,
                        'amount' => $refundAmount,
                        'status' => 'completed',
                        'type' => 'refund',
                        'description' => "Refund for cancelled order #{$order->id}",
                    ]);
                    
                    // Send SMS notification for refund
                    if ($user->phone) {
                        $message = "Your order #{$order->id} has been cancelled and GHS " . number_format($refundAmount, 2) . " has been refunded to your wallet.";
                        $smsService->sendSms($user->phone, $message);
                    }
                }
            }
        }

        // Send SMS notifications if status changed to completed
        if ($request->status === 'completed') {
            $smsService = new SmsService();
            foreach ($orders as $order) {
                if ($order->status !== 'completed' && $order->user->phone) {
                    $message = "Your order #{$order->id} has been completed. Total: GHS " . number_format($order->total, 2);
                    $smsService->sendSms($order->user->phone, $message);
                }
            }
        }

        return redirect()->back()->with('success', "Updated {$updatedCount} order(s) successfully.");
    }

    /**
     * Display the admin transactions page.
     */
    public function transactions(Request $request)
    {
        $transactions = Transaction::with('user', 'order.user')->latest();

        if ($request->has('type') && $request->input('type') !== '') {
            $transactions->where('type', $request->input('type'));
        }

        return Inertia::render('Admin/Transactions', [
            'transactions' => $transactions->paginate(10),
            'filterType' => $request->input('type', ''),
        ]);
    }

    /**
     * Store a new user.
     */
    public function storeUser(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:8',
            'role' => 'required|string|in:customer,agent,dealer,admin',
        ]);

        User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => bcrypt($request->password),
            'role' => $request->role,
        ]);

        return redirect()->route('admin.users');
    }

    /**
     * Update the user's role.
     */
    public function updateUserRole(Request $request, User $user)
    {
        $request->validate([
            'role' => 'required|string|in:customer,agent,dealer,admin',
        ]);

        $user->update([
            'role' => $request->role,
        ]);

        return redirect()->route('admin.users');
    }

    /**
     * Delete the user.
     */
    public function deleteUser(User $user)
    {
        $user->delete();

        return redirect()->route('admin.users');
    }

    /**
     * Credit user's wallet.
     */
    public function creditWallet(Request $request, User $user)
    {
        $request->validate([
            'amount' => 'required|numeric|min:0.01',
        ]);

        $user->increment('wallet_balance', $request->amount);

        // Create transaction record
        Transaction::create([
            'user_id' => $user->id,
            'order_id' => null,
            'amount' => $request->amount,
            'status' => 'completed',
            'type' => 'credit',
            'description' => 'Admin wallet credit of GHS ' . number_format($request->amount, 2),
        ]);

        return redirect()->route('admin.users')->with('success', 'Wallet credited successfully.');
    }

    /**
     * Debit user's wallet.
     */
    public function debitWallet(Request $request, User $user)
    {
        $request->validate([
            'amount' => 'required|numeric|min:0.01',
        ]);

        if ($user->wallet_balance < $request->amount) {
            return redirect()->route('admin.users')->with('error', 'Insufficient wallet balance.');
        }

        $user->decrement('wallet_balance', $request->amount);

        // Create transaction record
        Transaction::create([
            'user_id' => $user->id,
            'order_id' => null,
            'amount' => $request->amount,
            'status' => 'completed',
            'type' => 'debit',
            'description' => 'Admin wallet debit of GHS ' . number_format($request->amount, 2),
        ]);

        return redirect()->route('admin.users')->with('success', 'Wallet debited successfully.');
    }

    /**
     * Store a new product.
     */
    public function storeProduct(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'network' => 'required|string|max:255',
            'description' =>'required|string|max:255',
            'expiry' =>'required|string|max:255',
            'status'=>'required|string|max:255',
            'quantity' => 'required|string|max:255',
            'price' => 'required|numeric',
            'product_type' => 'required|string|in:agent_product,customer_product,dealer_product',
        ]);

        Product::create([
            'name' => $request->name,
            'network' => $request->network,
            'description'=> $request ->description,
            'expiry'=> $request->expiry,
            'status'=>$request ->status,
            'quantity'=>$request->quantity,
            'price' => $request->price,
            'product_type' => $request->product_type,
        ]);

        return redirect()->route('admin.products');
    }

    /**
     * Update a product.
     */
    public function updateProduct(Request $request, Product $product)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'network' => 'required|string|max:255',
            'description' =>'required|string|max:255',
            'expiry' =>'required|string|max:255',
            'status'=>'required|string|max:255',
            'quantity' => 'required|string|max:255',
            'price' => 'required|numeric',
            'product_type' => 'required|string|in:agent_product,customer_product,dealer_product',
        ]);

        $product->update([
            'name' => $request->name,
            'network' => $request->network,
            'description'=> $request->description,
            'expiry'=> $request->expiry,
            'status'=>$request->status,
            'quantity'=>$request->quantity,
            'price' => $request->price,
            'product_type' => $request->product_type,
        ]);

        return redirect()->route('admin.products');
    }

    /**
     * Delete a product.
     */
    public function deleteProduct(Product $product)
    {
        $product->delete();
        return redirect()->route('admin.products');
    }

    /**
     * Display user transaction history.
     */
    public function userTransactions(User $user)
    {
        $transactions = Transaction::where('user_id', $user->id)
            ->with('order')
            ->latest()
            ->get();

        return Inertia::render('Admin/UserTransactions', [
            'user' => $user,
            'transactions' => $transactions,
        ]);
    }

    /**
     * Export selected orders to CSV.
     */
    public function exportOrders(Request $request)
    {
        $request->validate([
            'order_ids' => 'required|array|min:1',
            'order_ids.*' => 'exists:orders,id',
        ]);

        $orders = Order::with(['products' => function($query) {
            $query->withPivot('quantity', 'beneficiary_number');
        }])->whereIn('id', $request->order_ids)->get();

        $filename = 'orders_' . date('Y-m-d_H-i-s') . '.csv';
        
        $headers = [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => 'attachment; filename="' . $filename . '"',
        ];

        $callback = function() use ($orders) {
            $file = fopen('php://output', 'w');
            fputcsv($file, ['Number', 'Volume']);
            
            foreach ($orders as $order) {
                foreach ($order->products as $product) {
                    fputcsv($file, [
                        $product->pivot->beneficiary_number ?? 'N/A',
                        $product->pivot->quantity ?? 0
                    ]);
                }
            }
            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
    }

    /**
     * Toggle API status.
     */
    public function toggleApi(Request $request)
    {
        $request->validate([
            'enabled' => 'required|boolean',
        ]);

        Setting::set('api_enabled', $request->enabled ? 'true' : 'false');

        return redirect()->back()->with('success', 'API status updated successfully.');
    }

    /**
     * Display alerts management page.
     */
    public function alerts()
    {
        $alerts = Alert::latest()->get();
        return Inertia::render('Admin/Alerts', [
            'alerts' => $alerts
        ]);
    }

    /**
     * Store a new alert.
     */
    public function storeAlert(Request $request)
    {
        $request->validate([
            'title' => 'required|string|max:255',
            'message' => 'required|string',
            'type' => 'required|string|in:info,warning,success,error',
            'expires_at' => 'nullable|date|after:now'
        ]);

        Alert::create($request->all());
        return redirect()->back()->with('success', 'Alert created successfully.');
    }

    /**
     * Update an alert.
     */
    public function updateAlert(Request $request, Alert $alert)
    {
        $request->validate([
            'title' => 'required|string|max:255',
            'message' => 'required|string',
            'type' => 'required|string|in:info,warning,success,error',
            'is_active' => 'boolean',
            'expires_at' => 'nullable|date|after:now'
        ]);

        $data = $request->all();
        if (empty($data['expires_at'])) {
            $data['expires_at'] = null;
        }
        
        $alert->update($data);
        return redirect()->back()->with('success', 'Alert updated successfully.');
    }

    /**
     * Delete an alert.
     */
    public function deleteAlert(Alert $alert)
    {
        $alert->delete();
        return redirect()->back()->with('success', 'Alert deleted successfully.');
    }
}