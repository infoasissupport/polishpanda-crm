<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Lead extends Model
{
    protected $guarded = [];

    protected $casts = [
        'estimated_value' => 'float',
        'follow_up_date' => 'date',
        'validity_from_date' => 'date',
        'validity_to_date' => 'date',
        'travel_date' => 'date',
        'return_date' => 'date',
        'insurance_taken' => 'boolean',
        'passengers_count' => 'integer',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function branch()
    {
        return $this->belongsTo(Branch::class);
    }

    public function customer()
    {
        return $this->belongsTo(Customer::class, 'converted_customer_id');
    }

    public function followUps()
    {
        return $this->hasMany(LeadFollowUp::class, 'lead_id')->orderBy('created_at', 'desc');
    }
}
