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
        $tables = [
            'branches',
            'services',
            'staff',
            'customers',
            'vehicles',
            'bookings',
            'job_cards',
            'invoices',
            'inventory_items',
            'whatsapp_chats',
            'notifications',
        ];

        foreach ($tables as $table) {
            Schema::table($table, function (Blueprint $tableGroup) {
                $tableGroup->unsignedBigInteger('user_id')->nullable()->after('id');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        $tables = [
            'branches',
            'services',
            'staff',
            'customers',
            'vehicles',
            'bookings',
            'job_cards',
            'invoices',
            'inventory_items',
            'whatsapp_chats',
            'notifications',
        ];

        foreach ($tables as $table) {
            Schema::table($table, function (Blueprint $tableGroup) {
                $tableGroup->dropColumn('user_id');
            });
        }
    }
};
