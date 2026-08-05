<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AgentMashupProduct extends Model
{
    protected $fillable = ['agent_shop_id', 'mashup_package_id', 'agent_price', 'is_active'];

    protected $casts = [
        'agent_price' => 'decimal:2',
        'is_active' => 'boolean',
    ];

    public function agentShop()
    {
        return $this->belongsTo(AgentShop::class);
    }

    public function mashupPackage()
    {
        return $this->belongsTo(MashupPackage::class);
    }
}
