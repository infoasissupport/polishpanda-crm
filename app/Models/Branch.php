<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Branch extends Model
{
    protected $guarded = [];

    protected $casts = [
        'active' => 'boolean',
    ];

    public function bookings()
    {
        return $this->hasMany(Booking::class, 'branch_id');
    }
}
