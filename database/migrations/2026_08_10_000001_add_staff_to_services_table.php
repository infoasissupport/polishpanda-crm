<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasColumn('services', 'staff')) {
            Schema::table('services', function (Blueprint $table) {
                $table->integer('staff')->default(1)->after('duration');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('services', 'staff')) {
            Schema::table('services', function (Blueprint $table) {
                $table->dropColumn('staff');
            });
        }
    }
};
