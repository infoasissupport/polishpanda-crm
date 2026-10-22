<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Notification extends Model
{
    protected $guarded = [];

    protected $casts = [
        'read' => 'boolean',
        'read_at' => 'datetime',
        'branch_id' => 'integer',
    ];
}
