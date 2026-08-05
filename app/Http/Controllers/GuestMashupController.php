<?php

namespace App\Http\Controllers;

use App\Models\MashupOrder;
use App\Models\MashupPackage;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Inertia\Inertia;

class GuestMashupController extends Controller
{
    public function index()
    {
        $packages = MashupPackage::where('is_active', true)->get();

        return Inertia::render('GuestMashup', [
            'packages' => $packages,
        ]);
    }

    public function checkout(Request $request)
    {
        $request->validate([
            'mashup_package_id' => 'required|exists:mashup_packages,id',
            'beneficiary_number' => 'required|string|regex:/^[0-9]{10}$/',
            'customer_email' => 'required|email',
        ]);

        $package = MashupPackage::where('id', $request->mashup_package_id)
            ->where('is_active', true)
            ->firstOrFail();

        $reference = 'mashup_' . Str::random(10) . '_' . $request->beneficiary_number;

        $response = Http::withHeaders([
            'Authorization' => 'Bearer ' . config('paystack.secret_key'),
            'Content-Type' => 'application/json',
        ])->post('https://api.paystack.co/transaction/initialize', [
            'email' => $request->customer_email,
            'amount' => $package->price * 100,
            'callback_url' => route('guest.mashup.callback'),
            'reference' => $reference,
            'metadata' => [
                'mashup_package_id' => $package->id,
                'customer_email' => $request->customer_email,
                'beneficiary_number' => $request->beneficiary_number,
            ],
        ]);

        if ($response->successful()) {
            return Inertia::location($response->json('data.authorization_url'));
        }

        return back()->with('error', 'Payment initialization failed');
    }

    public function handleCallback(Request $request)
    {
        $reference = $request->reference;

        $response = Http::withHeaders([
            'Authorization' => 'Bearer ' . config('paystack.secret_key'),
        ])->get("https://api.paystack.co/transaction/verify/{$reference}");

        if (!$response->successful() || $response->json('data.status') !== 'success') {
            return redirect()->route('guest.mashup')->with('error', 'Payment verification failed');
        }

        $existing = MashupOrder::where('paystack_reference', $reference)->first();
        if ($existing) {
            return redirect()->route('guest.mashup')->with('success', 'Order already exists. ID: #' . $existing->id);
        }

        $metadata = $response->json('data.metadata');

        $package = MashupPackage::find($metadata['mashup_package_id']);
        if (!$package) {
            return redirect()->route('guest.mashup')->with('error', 'Package not found');
        }

        MashupOrder::create([
            'user_id' => null,
            'mashup_package_id' => $package->id,
            'beneficiary_number' => $metadata['beneficiary_number'],
            'amount' => $package->price,
            'status' => 'pending',
            'paystack_reference' => $reference,
            'customer_email' => $metadata['customer_email'],
        ]);

        return redirect()->route('guest.mashup')->with('success', 'Mashup order placed successfully!');
    }

    public function trackOrder(Request $request)
    {
        $request->validate([
            'paystack_reference' => 'required|string|starts_with:mashup_|min:10|max:100',
        ], [
            'paystack_reference.starts_with' => 'Only mashup order references are allowed here.',
        ]);

        try {
            $order = MashupOrder::where('paystack_reference', $request->paystack_reference)
                ->with('package')
                ->first();

            if ($order) {
                return response()->json([
                    'success' => true,
                    'order_found' => true,
                    'order' => [
                        'id' => $order->id,
                        'status' => $order->status,
                        'amount' => $order->amount,
                        'beneficiary_number' => $order->beneficiary_number,
                        'package_name' => $order->package->name ?? 'N/A',
                        'package_size' => $order->package->size ?? 'N/A',
                        'created_at' => $order->created_at->format('Y-m-d H:i:s'),
                    ],
                ]);
            }

            // Verify with Paystack and create order if valid
            $verification = $this->verifyWithPaystack($request->paystack_reference);

            if (!$verification['success']) {
                return response()->json([
                    'success' => false,
                    'message' => $verification['message'],
                ]);
            }

            $paidAmount = $verification['amount'];
            $metadata = $verification['metadata'];

            $package = MashupPackage::where('id', $metadata['mashup_package_id'] ?? 0)
                ->where('is_active', true)
                ->first();

            if (!$package || abs($package->price - $paidAmount) > 0.01) {
                return response()->json([
                    'success' => false,
                    'message' => 'Could not match payment to a mashup package. Contact support.',
                ]);
            }

            // Create the order
            $order = DB::transaction(function () use ($request, $package, $metadata) {
                if (MashupOrder::where('paystack_reference', $request->paystack_reference)->lockForUpdate()->exists()) {
                    return MashupOrder::where('paystack_reference', $request->paystack_reference)->first();
                }

                return MashupOrder::create([
                    'user_id' => null,
                    'mashup_package_id' => $package->id,
                    'beneficiary_number' => $metadata['beneficiary_number'] ?? 'unknown',
                    'amount' => $package->price,
                    'status' => 'pending',
                    'paystack_reference' => $request->paystack_reference,
                    'customer_email' => $metadata['customer_email'] ?? '',
                ]);
            });

            return response()->json([
                'success' => true,
                'order_found' => true,
                'order' => [
                    'id' => $order->id,
                    'status' => $order->status,
                    'amount' => $order->amount,
                    'beneficiary_number' => $order->beneficiary_number,
                    'package_name' => $package->name,
                    'package_size' => $package->size,
                    'created_at' => $order->created_at->format('Y-m-d H:i:s'),
                ],
                'message' => 'Order recovered successfully!',
            ]);
        } catch (\Exception $e) {
            Log::error('Mashup track order error', ['error' => $e->getMessage()]);

            return response()->json([
                'success' => false,
                'message' => 'An error occurred. Please try again.',
            ], 500);
        }
    }

    private function verifyWithPaystack(string $reference): array
    {
        $response = Http::withHeaders([
            'Authorization' => 'Bearer ' . config('paystack.secret_key'),
        ])->timeout(30)->get("https://api.paystack.co/transaction/verify/{$reference}");

        if (!$response->successful()) {
            return ['success' => false, 'message' => 'Failed to verify with Paystack'];
        }

        $data = $response->json('data');

        if (!$data || $data['status'] !== 'success') {
            return ['success' => false, 'message' => 'Payment was not successful or does not exist'];
        }

        return [
            'success' => true,
            'amount' => $data['amount'] / 100,
            'metadata' => $data['metadata'] ?? [],
            'email' => $data['customer']['email'] ?? '',
        ];
    }
}
