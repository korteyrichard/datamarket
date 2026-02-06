<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;
use Inertia\Inertia;

class ApiDocsController extends Controller
{
    public function index()
    {
        $user = Auth::user();
        
        if (!in_array($user->role, ['agent', 'dealer', 'admin'])) {
            abort(403, 'Access denied. Only agents, dealers and admins can access API documentation.');
        }
        
        $agentProducts = \App\Models\Product::where('product_type', 'agent_product')
            ->where('status', 'IN STOCK')
            ->select('id', 'name', 'network', 'quantity')
            ->orderBy('network')
            ->orderBy('name')
            ->get()
            ->groupBy('network');
        
        return Inertia::render('Dashboard/ApiDocs', [
            'agentProducts' => $agentProducts
        ]);
    }

    public function generateApiKey(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required',
        ]);

        if (Auth::attempt($request->only('email', 'password'))) {
            $user = Auth::user();
            $apiKey = Str::random(64);
            
            // Store API key in user table or create a separate api_keys table
            $user->update(['api_key' => $apiKey]);
            
            return response()->json([
                'success' => true,
                'api_key' => $apiKey,
                'user' => $user->only(['id', 'name', 'email'])
            ]);
        }

        return response()->json([
            'success' => false,
            'message' => 'Invalid credentials'
        ], 401);
    }
}