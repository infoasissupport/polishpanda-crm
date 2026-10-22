<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CompanySetting extends Model
{
    protected $fillable = [
        'user_id',
        'company_name',
        'company_tagline',
        'company_email',
        'company_phone',
        'company_website',
        'company_gstin',
        'cgst_rate',
        'sgst_rate',
        'service_charge_rate',
        'company_address',
        'bank_name',
        'bank_branch',
        'bank_account_name',
        'bank_account_number',
        'bank_ifsc',
        'upi_id',
        'company_logo',
        'upi_qr_code',
        'signature',
        'instagram_url',
        'google_business_url'
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
