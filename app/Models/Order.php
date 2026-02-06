<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Carbon\Carbon;

class Order extends Model
{
    protected $fillable = ['user_id', 'total', 'status', 'api_status', 'beneficiary_number', 'network', 'reference_id', 'agent_id', 'customer_name', 'customer_phone', 'paystack_reference', 'customer_email'];
    
    protected $casts = [
        'created_at' => 'datetime:Y-m-d H:i:s',
        'updated_at' => 'datetime:Y-m-d H:i:s',
    ];
    
    protected static function boot()
    {
        parent::boot();
        
        static::creating(function ($model) {
            $model->created_at = Carbon::now('Africa/Accra');
            $model->updated_at = Carbon::now('Africa/Accra');
        });
        
        static::updating(function ($model) {
            $model->updated_at = Carbon::now('Africa/Accra');
        });
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function transactions()
    {
        return $this->hasMany(Transaction::class);
    }

    public function products()
    {
        return $this->belongsToMany(Product::class, 'order_product')
            ->withPivot('quantity', 'price', 'beneficiary_number')
            ->withTimestamps();
    }

    public function agent()
    {
        return $this->belongsTo(User::class, 'agent_id');
    }

    public function commission()
    {
        return $this->hasOne(Commission::class);
    }
}
