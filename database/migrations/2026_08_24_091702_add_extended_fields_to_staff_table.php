<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('staff', function (Blueprint $table) {
            $table->string('first_name')->nullable();
            $table->string('last_name')->nullable();
            $table->string('employee_id')->nullable();
            $table->string('native_place')->nullable();
            $table->string('gender')->nullable();
            $table->integer('age')->nullable();
            $table->string('marital_status')->nullable();
            $table->string('highest_education')->nullable();
            $table->string('email')->nullable();
            $table->string('photo')->nullable();
            $table->string('id_proof_path')->nullable();
            $table->string('pcc_certificate_path')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('staff', function (Blueprint $table) {
            $table->dropColumn([
                'first_name', 'last_name', 'employee_id', 'native_place', 
                'gender', 'age', 'marital_status', 'highest_education', 
                'email', 'photo', 'id_proof_path', 'pcc_certificate_path'
            ]);
        });
    }
};
