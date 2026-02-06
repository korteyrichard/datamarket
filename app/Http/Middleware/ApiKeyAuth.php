<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use App\Models\User;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

class ApiKeyAuth
{
    public function handle(Request $request, Closure $next)
    {
        $apiKey = $request->bearerToken();
        
        if (!$apiKey) {
            return response()->json(['message' => 'API key required'], 401);
        }

        // Validate API key format
        if (!preg_match('/^[a-zA-Z0-9]{32,}$/', $apiKey)) {
            Log::warning('Invalid API key format attempted', [
                'ip' => $request->ip(),
                'user_agent' => $request->userAgent()
            ]);
            return response()->json(['message' => 'Invalid API key format'], 401);
        }

        // Rate limiting per API key
        $cacheKey = 'api_rate_limit:' . hash('sha256', $apiKey);
        $attempts = Cache::get($cacheKey, 0);
        
        if ($attempts >= 100) { // 100 requests per minute
            return response()->json(['message' => 'Rate limit exceeded'], 429);
        }
        
        Cache::put($cacheKey, $attempts + 1, 60); // 1 minute

        // Use cache for API key lookup to reduce database queries
        $userCacheKey = 'api_user:' . hash('sha256', $apiKey);
        $user = Cache::remember($userCacheKey, 300, function () use ($apiKey) {
            return User::where('api_key', $apiKey)->first();
        });
        
        if (!$user) {
            Log::warning('Invalid API key attempted', [
                'ip' => $request->ip(),
                'user_agent' => $request->userAgent()
            ]);
            return response()->json(['message' => 'Invalid API key'], 401);
        }

        // Log API usage for monitoring
        Log::info('API request', [
            'user_id' => $user->id,
            'endpoint' => $request->path(),
            'method' => $request->method(),
            'ip' => $request->ip()
        ]);

        auth()->login($user);
        
        return $next($request);
    }
}