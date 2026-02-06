<?php

namespace App\Http\Controllers;

use App\Models\AgentShop;
use App\Traits\ApiResponse;

class ShopController extends Controller
{
    use ApiResponse;

    public function show($username)
    {
        $shop = AgentShop::where('username', '=', $username)
            ->where('is_active', '=', true)
            ->with(['user', 'agentProducts.product'])
            ->first();

        if (!$shop) {
            return $this->errorResponse('Shop not found', 404);
        }

        $products = $shop->agentProducts->where('is_active', true)->map(function ($agentProduct) {
            return [
                'id' => $agentProduct->product->id,
                'name' => $agentProduct->product->name,
                'description' => $agentProduct->product->description,
                'network' => $agentProduct->product->network,
                'base_price' => $agentProduct->product->price,
                'agent_price' => $agentProduct->agent_price,
                'product_type' => $agentProduct->product->product_type,
                'status' => $agentProduct->product->status
            ];
        });

        return $this->successResponse([
            'shop' => [
                'name' => $shop->name,
                'username' => $shop->username,
                'agent_name' => $shop->user->name,
                'color' => $shop->color
            ],
            'products' => $products
        ]);
    }
}