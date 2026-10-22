<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasColumn('services', 'service_charge_rate')) {
            Schema::table('services', function (Blueprint $table) {
                $table->decimal('service_charge_rate', 5, 2)->nullable()->default(0)->after('price');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('services', 'service_charge_rate')) {
            Schema::table('services', function (Blueprint $table) {
                $table->dropColumn('service_charge_rate');
            });
        }
    }
};
