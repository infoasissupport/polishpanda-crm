<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('job_cards', function (Blueprint $table) {
            $table->unsignedBigInteger('booking_id')->nullable()->after('id');
            $table->string('customer')->nullable()->after('booking_id');
            $table->string('phone')->nullable()->after('customer');
            $table->string('invoice_id')->nullable()->after('signed_off_time');
        });

        Schema::table('invoices', function (Blueprint $table) {
            $table->string('job_card_id')->nullable()->after('id');
            $table->string('vehicle')->nullable()->after('phone');
        });
    }

    public function down(): void
    {
        Schema::table('invoices', function (Blueprint $table) {
            $table->dropColumn(['job_card_id', 'vehicle']);
        });

        Schema::table('job_cards', function (Blueprint $table) {
            $table->dropColumn(['booking_id', 'customer', 'phone', 'invoice_id']);
        });
    }
};
