<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Service extends Model
{
    protected $guarded = [];

    protected $casts = [
        'price' => 'integer',
        'duration' => 'integer',
        'staff' => 'integer',
        'gst_rate' => 'decimal:2',
        'service_charge_rate' => 'decimal:2',
        'active' => 'boolean',
        'products' => 'array',
    ];
}
