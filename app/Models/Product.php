<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Product extends Model
{
    protected $fillable = ['name', 'price', 'description', 'network', 'expiry','quantity','status', 'product_type'];

    protected $casts = [
        'price' => 'decimal:2',
    ];

    public function carts()
    {
        return $this->hasMany(Cart::class);
    }
    
    public function orders()
    {
        return $this->belongsToMany(Order::class, 'order_product')
            ->withPivot('quantity', 'price', 'beneficiary_number')
            ->withTimestamps();
    }

    // Scope methods for role-based filtering
    public function scopeForCustomers($query)
    {
        return $query->where('product_type', 'customer_product');
    }

    public function scopeForAgents($query)
    {
        return $query->where('product_type', 'agent_product');
    }

    public function scopeForDealers($query)
    {
        return $query->where('product_type', 'dealer_product');
    }

    public function scopeInStock($query)
    {
        return $query->where('status', 'IN STOCK');
    }

    public function scopeForRole($query, $role)
    {
        switch ($role) {
            case 'dealer':
                return $query->forDealers();
            case 'agent':
                return $query->forAgents();
            case 'customer':
                return $query->forCustomers();
            default:
                return $query; // Admin sees all
        }
    }
}
