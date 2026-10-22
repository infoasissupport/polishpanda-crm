<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Create expenses table
        Schema::create('expenses', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->unsignedBigInteger('branch_id')->nullable();
            $table->string('category'); // emi, rent, staff_salary, inventory, utilities, other
            $table->string('name');
            $table->integer('amount');
            $table->date('expense_date');
            $table->text('notes')->nullable();
            $table->unsignedBigInteger('ref_id')->nullable(); // Optional staff or inventory reference
            $table->timestamps();
        });

        // 2. Add unit_cost to inventory_items table
        Schema::table('inventory_items', function (Blueprint $table) {
            $table->integer('unit_cost')->default(0)->after('reorder');
        });

        // 3. Add base_salary to staff table
        Schema::table('staff', function (Blueprint $table) {
            $table->integer('base_salary')->default(0)->after('commission');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('expenses');

        Schema::table('inventory_items', function (Blueprint $table) {
            $table->dropColumn('unit_cost');
        });

        Schema::table('staff', function (Blueprint $table) {
            $table->dropColumn('base_salary');
        });
    }
};
