<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        $tables = ['bays', 'customers', 'vehicles', 'services', 'inventory_items', 'staff'];
        foreach ($tables as $t) {
            Schema::table($t, function (Blueprint $table) {
                if (!Schema::hasColumn($table->getTable(), 'branch_id')) {
                    $table->integer('branch_id')->nullable();
                }
            });
        }
    }

    public function down(): void
    {
        // No down migration needed for this hotfix
    }
};
