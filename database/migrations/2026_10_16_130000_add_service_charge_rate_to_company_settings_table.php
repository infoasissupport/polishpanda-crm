<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /** Service charge as a % of a service's taxable value (see App\Support\ServicePricing). */
    public function up(): void
    {
        if (! Schema::hasColumn('company_settings', 'service_charge_rate')) {
            Schema::table('company_settings', function (Blueprint $table) {
                $table->decimal('service_charge_rate', 5, 2)->nullable()->default(20)->after('sgst_rate');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('company_settings', 'service_charge_rate')) {
            Schema::table('company_settings', function (Blueprint $table) {
                $table->dropColumn('service_charge_rate');
            });
        }
    }
};
