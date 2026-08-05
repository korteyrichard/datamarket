<?php

namespace App\Http\Controllers;

use App\Models\MashupPackage;
use App\Models\MashupOrder;
use Illuminate\Http\Request;
use Inertia\Inertia;

class AdminMashupController extends Controller
{
    public function index()
    {
        $packages = MashupPackage::latest()->get();
        $orders = MashupOrder::with(['user', 'package'])->latest()->paginate(50);

        return Inertia::render('Admin/MashupPackages', [
            'packages' => $packages,
            'orders' => $orders,
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'size' => 'required|string|max:255',
            'price' => 'required|numeric|min:0.01',
        ]);

        MashupPackage::create($request->only('name', 'size', 'price'));

        return redirect()->back()->with('success', 'Mashup package created successfully.');
    }

    public function update(Request $request, MashupPackage $mashupPackage)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'size' => 'required|string|max:255',
            'price' => 'required|numeric|min:0.01',
            'is_active' => 'boolean',
        ]);

        $mashupPackage->update($request->only('name', 'size', 'price', 'is_active'));

        return redirect()->back()->with('success', 'Mashup package updated successfully.');
    }

    public function destroy(MashupPackage $mashupPackage)
    {
        $mashupPackage->delete();
        return redirect()->back()->with('success', 'Mashup package deleted successfully.');
    }

    public function updateOrderStatus(Request $request, MashupOrder $mashupOrder)
    {
        $request->validate([
            'status' => 'required|string|in:pending,processing,completed,cancelled',
        ]);

        $mashupOrder->update(['status' => $request->status]);

        return redirect()->back()->with('success', 'Order status updated.');
    }

    public function bulkUpdateStatus(Request $request)
    {
        $request->validate([
            'order_ids' => 'required|array|min:1',
            'order_ids.*' => 'exists:mashup_orders,id',
            'status' => 'required|string|in:pending,processing,completed,cancelled',
        ]);

        $count = MashupOrder::whereIn('id', $request->order_ids)
            ->update(['status' => $request->status]);

        return redirect()->back()->with('success', "Updated {$count} order(s) successfully.");
    }

    public function export(Request $request)
    {
        $request->validate([
            'order_ids' => 'required|array|min:1',
            'order_ids.*' => 'exists:mashup_orders,id',
        ]);

        $orders = MashupOrder::with(['user', 'package'])
            ->whereIn('id', $request->order_ids)
            ->get();

        $filename = 'mashup_orders_' . date('Y-m-d_H-i-s') . '.csv';

        $headers = [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => 'attachment; filename="' . $filename . '"',
        ];

        $callback = function () use ($orders) {
            $file = fopen('php://output', 'w');
            fputcsv($file, ['Number', 'Package']);

            foreach ($orders as $order) {
                fputcsv($file, [
                    $order->beneficiary_number,
                    $order->package->name ?? 'N/A',
                ]);
            }
            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
    }
}
