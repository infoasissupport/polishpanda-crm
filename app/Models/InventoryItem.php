<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class InventoryItem extends Model
{
    protected $guarded = [];

    protected $casts = [
        'stock' => 'integer',
        'reorder' => 'integer',
        'low_stock_alert' => 'boolean',
        'active' => 'boolean',
    ];
}
