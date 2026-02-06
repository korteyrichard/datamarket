<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ReferralCommission extends Model
{
    protected $fillable = ['referrer_id', 'commission_id', 'amount', 'status', 'available_at', 'type'];

    protected $casts = [
        'amount' => 'decimal:2',
        'available_at' => 'datetime',
    ];

    public function referrer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'referrer_id');
    }

    public function commission(): BelongsTo
    {
        return $this->belongsTo(Commission::class);
    }

    // Validation rules
    public static function rules(): array
    {
        return [
            'referrer_id' => 'required|exists:users,id',
            'commission_id' => 'nullable|exists:commissions,id',
            'amount' => 'required|numeric|min:0|max:999999.99',
            'status' => 'required|in:pending,available,withdrawn',
            'type' => 'required|string|max:50',
            'available_at' => 'nullable|date'
        ];
    }
}