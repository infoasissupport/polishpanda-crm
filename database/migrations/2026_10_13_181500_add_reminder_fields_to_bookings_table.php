<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('bookings', function (Blueprint $table) {
            $table->string('reminder_type', 50)->nullable()->after('notes');
            $table->date('reminder_date')->nullable()->after('reminder_type');
            $table->text('reminder_note')->nullable()->after('reminder_date');
            $table->boolean('reminder_notified')->default(false)->after('reminder_note');
        });
    }

    public function down(): void
    {
        Schema::table('bookings', function (Blueprint $table) {
            $table->dropColumn(['reminder_type', 'reminder_date', 'reminder_note', 'reminder_notified']);
        });
    }
};
