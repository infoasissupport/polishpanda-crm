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
        Schema::create('leads', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user_id')->nullable()->index();
            $table->integer('branch_id')->nullable()->index();
            $table->string('name');
            $table->string('phone');
            $table->string('email')->nullable();
            $table->string('vehicle')->nullable();
            $table->string('vehicle_plate')->nullable();
            $table->string('service_interested')->nullable();
            $table->string('source')->default('Walk-in');
            $table->string('status')->default('new');
            $table->decimal('estimated_value', 12, 2)->nullable()->default(0);
            $table->date('follow_up_date')->nullable();
            $table->text('notes')->nullable();
            $table->unsignedBigInteger('converted_customer_id')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('leads');
    }
};
