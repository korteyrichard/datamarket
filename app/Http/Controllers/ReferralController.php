<?php

namespace App\Http\Controllers;

use App\Services\ReferralService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class ReferralController extends Controller
{
    private $referralService;

    public function __construct(ReferralService $referralService)
    {
        $this->referralService = $referralService;
    }

    public function generateLink(Request $request): JsonResponse
    {
        $user = $request->user();
        
        if (!$user->isAgent() && $user->role !== 'dealer') {
            return response()->json([
                'success' => false,
                'message' => 'Only agents and dealers can generate referral links'
            ], 403);
        }

        $referralLink = $this->referralService->generateReferralLink($user);

        return response()->json([
            'success' => true,
            'referral_link' => $referralLink,
            'referral_code' => $user->referral_code
        ]);
    }

    public function getStats(Request $request): JsonResponse
    {
        $user = $request->user();
        
        // Only allow users to view their own stats
        if ($request->has('user_id') && $request->user_id != $user->id && !$user->isAdmin()) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized access'
            ], 403);
        }
        
        $stats = $this->referralService->getReferralStats($user);

        return response()->json([
            'success' => true,
            'data' => $stats
        ]);
    }
}