<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class JobCard extends Model
{
    protected $guarded = [];

    protected $keyType = 'string';

    public $incrementing = false;

    protected $casts = [
        'checklist' => 'array',
        'booking_id' => 'integer',
        'branch_id' => 'integer',
        'started_at_at' => 'datetime',
        'completed_at_at' => 'datetime',
    ];

    public function invoice()
    {
        return $this->hasOne(Invoice::class, 'job_card_id', 'id');
    }
}
