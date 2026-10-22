<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class LeadFollowUp extends Model
{
    protected $guarded = [];

    protected $casts = [
        'next_follow_up_date' => 'date',
    ];

    public function lead()
    {
        return $this->belongsTo(Lead::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
