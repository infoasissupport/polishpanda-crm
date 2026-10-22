<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Invoice extends Model
{
    protected $guarded = [];

    protected $keyType = 'string';

    public $incrementing = false;

    protected $casts = [
        'branch_id' => 'integer',
        'subtotal' => 'float',
        'amount' => 'float',
        'tax_rate' => 'decimal:2',
        'tax_amount' => 'float',
        'discount_amount' => 'integer',
        'tax_inclusive' => 'boolean',
        'paid_at' => 'datetime',
        'due_at' => 'datetime',
    ];
}
