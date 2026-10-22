<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('branches', function (Blueprint $table) {
            $table->dropColumn('default_language');
        });

        Schema::table('customers', function (Blueprint $table) {
            $table->dropColumn('preferred_language');
        });

        Schema::table('bookings', function (Blueprint $table) {
            $table->dropColumn('preferred_language');
        });
    }

    public function down(): void
    {
        Schema::table('branches', function (Blueprint $table) {
            $table->string('default_language')->default('Malayalam')->after('state');
        });

        Schema::table('customers', function (Blueprint $table) {
            $table->string('preferred_language')->default('Malayalam')->after('district');
        });

        Schema::table('bookings', function (Blueprint $table) {
            $table->string('preferred_language')->default('Malayalam')->after('source');
        });
    }
};
