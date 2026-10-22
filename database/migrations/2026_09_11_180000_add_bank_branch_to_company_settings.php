<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::table('company_settings', function (Blueprint $table) {
            $table->string('bank_branch')->nullable()->after('bank_name');
        });
    }

    public function down()
    {
        Schema::table('company_settings', function (Blueprint $table) {
            $table->dropColumn('bank_branch');
        });
    }
};
