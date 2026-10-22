<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Booking extends Model
{
    protected $guarded = [];

    protected $casts = [
        'branch_id' => 'integer',
        'booking_date' => 'date',
        'pickup_required' => 'boolean',
        'whatsapp_opt_in' => 'boolean',
        'reminder_date' => 'date',
        'reminder_notified' => 'boolean',
    ];

    public function branch()
    {
        return $this->belongsTo(Branch::class);
    }
}
