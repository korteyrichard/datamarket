<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Auth\Events\Registered;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules;
use Inertia\Inertia;
use Inertia\Response;
use App\Services\ReferralService;

class RegisteredUserController extends Controller
{
    /**
     * Show the registration page.
     */
    public function create(Request $request): Response
    {
        return Inertia::render('auth/register', [
            'redirect' => $request->get('redirect'),
            'referralCode' => $request->get('ref')
        ]);
    }

    /**
     * Handle an incoming registration request.
     *
     * @throws \Illuminate\Validation\ValidationException
     */
    public function store(Request $request): RedirectResponse
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'business_name' => 'nullable|string|max:255',
            'phone' => 'nullable|string|max:20',
            'email' => 'required|string|lowercase|email|max:255|unique:'.User::class,
            'password' => ['required', 'confirmed', Rules\Password::defaults()],
            'referral_code' => 'nullable|string|exists:users,referral_code'
        ]);

        $user = User::create([
            'name' => $request->name,
            'business_name' => $request->business_name,
            'phone' => $request->phone,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'role' => $request->role ?? 'customer'
        ]);

        if ($request->referral_code) {
            $referralService = app(ReferralService::class);
            $referralService->processReferral($request->referral_code, $user);
            
            // Mark as converted if upgrading to agent immediately
            if (in_array($user->role, ['agent', 'dealer'])) {
                $referralService->markAsConverted($user);
            }
        }

        event(new Registered($user));

        Auth::login($user);

        // Check for redirect parameter
        if ($request->has('redirect')) {
            return redirect($request->redirect);
        }

        return to_route('dashboard');
    }
}
