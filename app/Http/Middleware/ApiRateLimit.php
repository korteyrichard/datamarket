<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Routing\Middleware\ThrottleRequests;

class ApiRateLimit extends ThrottleRequests
{
    /**
     * Handle an incoming request.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \Closure  $next
     * @param  int|string  $maxAttempts
     * @param  float|int  $decayMinutes
     * @param  string  $prefix
     * @return mixed
     */
    public function handle($request, Closure $next, $maxAttempts = 60, $decayMinutes = 1, $prefix = '')
    {
        // For authenticated users, allow more requests
        if ($request->user()) {
            $maxAttempts = 120; // 120 requests per minute for authenticated users
        } else {
            $maxAttempts = 30; // 30 requests per minute for unauthenticated users
        }

        return parent::handle($request, $next, $maxAttempts, $decayMinutes, $prefix);
    }
}