<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Marks invoices whose price already includes GST (the service price is the final amount).
     * Existing invoices stay false so their saved totals (GST added on top) are kept as they are.
     */
    public function up(): void
    {
        if (! Schema::hasColumn('invoices', 'tax_inclusive')) {
            Schema::table('invoices', function (Blueprint $table) {
                $table->boolean('tax_inclusive')->default(false);
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('invoices', 'tax_inclusive')) {
            Schema::table('invoices', function (Blueprint $table) {
                $table->dropColumn('tax_inclusive');
            });
        }
    }
};
