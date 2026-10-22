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
        Schema::table('users', function (Blueprint $table) {
            if (! Schema::hasColumn('users', 'role')) {
                $table->string('role')->default('admin')->after('email');
            }
            if (! Schema::hasColumn('users', 'owner_id')) {
                $table->foreignId('owner_id')->nullable()->after('role')->constrained('users')->onDelete('cascade');
            }
            if (! Schema::hasColumn('users', 'assigned_branch_id')) {
                $table->foreignId('assigned_branch_id')->nullable()->after('owner_id')->constrained('branches')->onDelete('set null');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            if (Schema::hasColumn('users', 'assigned_branch_id')) {
                $table->dropForeign(['assigned_branch_id']);
                $table->dropColumn('assigned_branch_id');
            }
            if (Schema::hasColumn('users', 'owner_id')) {
                $table->dropForeign(['owner_id']);
                $table->dropColumn('owner_id');
            }
            if (Schema::hasColumn('users', 'role')) {
                $table->dropColumn('role');
            }
        });
    }
};
