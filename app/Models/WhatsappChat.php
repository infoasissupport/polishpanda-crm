<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class WhatsappChat extends Model
{
    protected $guarded = [];

    protected $casts = [
        'customer_id' => 'integer',
        'branch_id' => 'integer',
        'opt_in' => 'boolean',
    ];
}
