<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Carbon\Carbon;

class MashupOrder extends Model
{
    protected $fillable = ['user_id', 'mashup_package_id', 'beneficiary_number', 'amount', 'status', 'paystack_reference', 'customer_email'];

    protected $casts = [
        'amount' => 'decimal:2',
        'created_at' => 'datetime:Y-m-d H:i:s',
    ];

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($model) {
            $model->created_at = Carbon::now('Africa/Accra');
            $model->updated_at = Carbon::now('Africa/Accra');
        });
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function package()
    {
        return $this->belongsTo(MashupPackage::class, 'mashup_package_id');
    }
}
