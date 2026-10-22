<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Staff extends Model
{
    protected $table = 'staff';

    protected $guarded = [];

    protected $casts = [
        'jobs_today' => 'integer',
        'commission' => 'integer',
        'performance' => 'decimal:2',
        'is_active' => 'boolean',
        'joined_at' => 'date',
    ];
}
