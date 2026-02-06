<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Withdrawal extends Model
{
    protected $fillable = ['agent_id', 'requested_amount', 'amount', 'fee_amount', 'payment_method', 'network', 'mobile_money_account_name', 'mobile_money_number', 'status', 'notes', 'processed_at'];

    protected $casts = [
        'requested_amount' => 'decimal:2',
        'amount' => 'decimal:2',
        'fee_amount' => 'decimal:2',
        'processed_at' => 'datetime',
    ];

    public function agent()
    {
        return $this->belongsTo(User::class, 'agent_id');
    }

    public function isPending()
    {
        return $this->status === 'pending';
    }

    public function isApproved()
    {
        return $this->status === 'approved';
    }

    public function isProcessing()
    {
        return $this->status === 'processing';
    }

    public function isPaid()
    {
        return $this->status === 'paid';
    }

    public function isRejected()
    {
        return $this->status === 'rejected';
    }

    public function getStatusColorAttribute()
    {
        return match($this->status) {
            'pending' => 'yellow',
            'processing' => 'blue',
            'approved' => 'green',
            'paid' => 'emerald',
            'rejected' => 'red',
            default => 'gray'
        };
    }

    public function getNetworkDisplayAttribute()
    {
        return match($this->network) {
            'mtn' => 'MTN',
            'telecel' => 'Telecel',
            default => ucfirst($this->network)
        };
    }
}