<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Commission extends Model
{
    protected $fillable = ['agent_id', 'order_id', 'amount', 'status', 'available_at'];

    protected $casts = [
        'amount' => 'decimal:2',
        'available_at' => 'datetime',
    ];

    public function agent()
    {
        return $this->belongsTo(User::class, 'agent_id');
    }

    public function order()
    {
        return $this->belongsTo(Order::class);
    }

    public function referralCommissions()
    {
        return $this->hasMany(ReferralCommission::class);
    }
}