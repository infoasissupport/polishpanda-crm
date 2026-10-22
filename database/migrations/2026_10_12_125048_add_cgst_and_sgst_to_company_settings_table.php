<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('company_settings', function (Blueprint $table) {
            $table->decimal('cgst_rate', 5, 2)->nullable()->default(0)->after('company_gstin');
            $table->decimal('sgst_rate', 5, 2)->nullable()->default(0)->after('cgst_rate');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('company_settings', function (Blueprint $table) {
            $table->dropColumn(['cgst_rate', 'sgst_rate']);
        });
    }
};
