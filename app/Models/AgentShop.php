<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AgentShop extends Model
{
    protected $fillable = ['user_id', 'name', 'username', 'is_active', 'color', 'whatsapp_contact'];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function agentProducts()
    {
        return $this->hasMany(AgentProduct::class);
    }

    public function products()
    {
        return $this->belongsToMany(Product::class, 'agent_products')
            ->withPivot('agent_price', 'is_active')
            ->withTimestamps();
    }
}