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
        Schema::table('leads', function (Blueprint $table) {
            $table->string('category')->default('detailing')->index()->after('branch_id');
            
            // Insurance fields
            $table->string('insurance_type')->nullable()->after('service_interested');
            $table->string('policy_number')->nullable()->after('insurance_type');
            $table->date('validity_from_date')->nullable()->after('policy_number');
            $table->date('validity_to_date')->nullable()->after('validity_from_date');
            $table->boolean('insurance_taken')->default(false)->after('validity_to_date');

            // Travel fields
            $table->string('destination')->nullable()->after('insurance_taken');
            $table->date('travel_date')->nullable()->after('destination');
            $table->date('return_date')->nullable()->after('travel_date');
            $table->integer('passengers_count')->nullable()->default(1)->after('return_date');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('leads', function (Blueprint $table) {
            $table->dropColumn([
                'category',
                'insurance_type',
                'policy_number',
                'validity_from_date',
                'validity_to_date',
                'insurance_taken',
                'destination',
                'travel_date',
                'return_date',
                'passengers_count',
            ]);
        });
    }
};
