<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Customer extends Model
{
    protected $guarded = [];

    protected $casts = [
        'starred' => 'boolean',
        'loyalty_points' => 'integer',
        'last_visit_at' => 'datetime',
        'follow_up_due_at' => 'datetime',
    ];

    public function vehicles()
    {
        return $this->hasMany(Vehicle::class, 'customer_id');
    }

    public function bookings()
    {
        return $this->hasMany(Booking::class, 'phone', 'phone');
    }
}
