<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AgentProduct extends Model
{
    protected $fillable = ['agent_shop_id', 'product_id', 'agent_price', 'is_active'];

    protected $casts = [
        'agent_price' => 'decimal:2',
        'is_active' => 'boolean',
    ];

    public function agentShop()
    {
        return $this->belongsTo(AgentShop::class);
    }

    public function product()
    {
        return $this->belongsTo(Product::class);
    }
}