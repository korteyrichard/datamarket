<?php

namespace App\Http\Controllers;

use App\Models\MashupOrder;
use App\Models\MashupPackage;
use App\Models\Transaction;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class MashupController extends Controller
{
    public function index()
    {
        $user = auth()->user();

        $packages = MashupPackage::where('is_active', true)->get();

        $orders = MashupOrder::where('user_id', $user->id)
            ->with('package')
            ->latest()
            ->get();

        return Inertia::render('Dashboard/MashupOrders', [
            'packages' => $packages,
            'orders' => $orders,
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'mashup_package_id' => 'required|exists:mashup_packages,id',
            'beneficiary_number' => 'required|string|regex:/^[0-9]{10}$/',
        ]);

        $user = auth()->user();
        $package = MashupPackage::where('id', $request->mashup_package_id)
            ->where('is_active', true)
            ->firstOrFail();

        // Use DB transaction with lock to prevent race conditions
        DB::transaction(function () use ($user, $package, $request) {
            $user = $user->lockForUpdate()->find($user->id);

            if ($user->wallet_balance < $package->price) {
                abort(422, 'Insufficient wallet balance.');
            }

            $user->decrement('wallet_balance', $package->price);

            MashupOrder::create([
                'user_id' => $user->id,
                'mashup_package_id' => $package->id,
                'beneficiary_number' => $request->beneficiary_number,
                'amount' => $package->price,
                'status' => 'pending',
            ]);

            Transaction::create([
                'user_id' => $user->id,
                'amount' => $package->price,
                'status' => 'completed',
                'type' => 'debit',
                'description' => "Mashup order: {$package->name} ({$package->size}) to {$request->beneficiary_number}",
            ]);
        });

        return redirect()->back()->with('success', 'Mashup order placed successfully.');
    }
}
