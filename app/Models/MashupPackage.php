<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MashupPackage extends Model
{
    protected $fillable = ['name', 'size', 'price', 'is_active'];

    protected $casts = [
        'price' => 'decimal:2',
        'is_active' => 'boolean',
    ];

    public function orders()
    {
        return $this->hasMany(MashupOrder::class);
    }
}
