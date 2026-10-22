<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('branches', function (Blueprint $table) {
            $table->string('code')->nullable()->after('name');
            $table->string('gst_number')->nullable()->after('location');
            $table->string('phone')->nullable()->after('gst_number');
            $table->string('city')->nullable()->after('phone');
            $table->string('state')->default('Kerala')->after('city');
            $table->string('default_language')->default('Malayalam')->after('state');
            $table->boolean('active')->default(true)->after('default_language');
        });

        Schema::table('services', function (Blueprint $table) {
            $table->string('category')->nullable()->after('name');
            $table->decimal('gst_rate', 5, 2)->default(18)->after('price');
            $table->boolean('active')->default(true)->after('icon');
        });

        Schema::table('staff', function (Blueprint $table) {
            $table->string('role')->nullable()->after('branch');
            $table->boolean('is_active')->default(true)->after('role');
            $table->date('joined_at')->nullable()->after('is_active');
        });

        Schema::table('customers', function (Blueprint $table) {
            $table->string('district')->nullable()->after('phone');
            $table->string('preferred_language')->default('Malayalam')->after('district');
            $table->string('gstin')->nullable()->after('preferred_language');
            $table->integer('loyalty_points')->default(0)->after('points');
            $table->dateTime('last_visit_at')->nullable()->after('last_visit');
            $table->dateTime('follow_up_due_at')->nullable()->after('last_visit_at');
        });

        Schema::table('vehicles', function (Blueprint $table) {
            $table->string('registration_state')->default('KL')->after('plate');
            $table->boolean('is_active')->default(true)->after('next');
            $table->dateTime('next_service_at')->nullable()->after('is_active');
        });

        Schema::table('bookings', function (Blueprint $table) {
            $table->unsignedBigInteger('branch_id')->nullable()->after('id');
            $table->date('booking_date')->nullable()->after('branch_id');
            $table->string('preferred_language')->default('Malayalam')->after('source');
            $table->boolean('pickup_required')->default(false)->after('preferred_language');
            $table->boolean('whatsapp_opt_in')->default(true)->after('pickup_required');
            $table->text('notes')->nullable()->after('whatsapp_opt_in');
        });

        Schema::table('job_cards', function (Blueprint $table) {
            $table->unsignedBigInteger('branch_id')->nullable()->after('id');
            $table->dateTime('started_at_at')->nullable()->after('started_at');
            $table->dateTime('completed_at_at')->nullable()->after('signed_off_time');
        });

        Schema::table('invoices', function (Blueprint $table) {
            $table->string('invoice_number')->nullable()->after('id');
            $table->unsignedBigInteger('branch_id')->nullable()->after('invoice_number');
            $table->integer('subtotal')->nullable()->after('amount');
            $table->decimal('tax_rate', 5, 2)->default(18)->after('subtotal');
            $table->integer('tax_amount')->default(0)->after('tax_rate');
            $table->integer('discount_amount')->default(0)->after('tax_amount');
            $table->string('payment_reference')->nullable()->after('status');
            $table->string('payment_status')->default('pending')->after('payment_reference');
            $table->dateTime('paid_at')->nullable()->after('payment_status');
            $table->dateTime('due_at')->nullable()->after('paid_at');
        });

        Schema::table('inventory_items', function (Blueprint $table) {
            $table->string('unit')->default('pcs')->after('icon');
            $table->boolean('low_stock_alert')->default(true)->after('reorder');
            $table->boolean('active')->default(true)->after('low_stock_alert');
        });

        Schema::table('notifications', function (Blueprint $table) {
            $table->string('type')->nullable()->after('icon');
            $table->string('link')->nullable()->after('title');
            $table->dateTime('read_at')->nullable()->after('read');
            $table->unsignedBigInteger('branch_id')->nullable()->after('read_at');
        });

        Schema::table('whatsapp_chats', function (Blueprint $table) {
            $table->unsignedBigInteger('customer_id')->nullable()->after('id');
            $table->unsignedBigInteger('branch_id')->nullable()->after('customer_id');
            $table->boolean('opt_in')->default(true)->after('phone');
        });
    }

    public function down(): void
    {
        Schema::table('whatsapp_chats', function (Blueprint $table) {
            $table->dropColumn(['customer_id', 'branch_id', 'opt_in']);
        });

        Schema::table('notifications', function (Blueprint $table) {
            $table->dropColumn(['type', 'link', 'read_at', 'branch_id']);
        });

        Schema::table('inventory_items', function (Blueprint $table) {
            $table->dropColumn(['unit', 'low_stock_alert', 'active']);
        });

        Schema::table('invoices', function (Blueprint $table) {
            $table->dropColumn([
                'invoice_number',
                'branch_id',
                'subtotal',
                'tax_rate',
                'tax_amount',
                'discount_amount',
                'payment_reference',
                'payment_status',
                'paid_at',
                'due_at',
            ]);
        });

        Schema::table('job_cards', function (Blueprint $table) {
            $table->dropColumn(['branch_id', 'started_at_at', 'completed_at_at']);
        });

        Schema::table('bookings', function (Blueprint $table) {
            $table->dropColumn([
                'branch_id',
                'booking_date',
                'preferred_language',
                'pickup_required',
                'whatsapp_opt_in',
                'notes',
            ]);
        });

        Schema::table('vehicles', function (Blueprint $table) {
            $table->dropColumn(['registration_state', 'is_active', 'next_service_at']);
        });

        Schema::table('customers', function (Blueprint $table) {
            $table->dropColumn([
                'district',
                'preferred_language',
                'gstin',
                'loyalty_points',
                'last_visit_at',
                'follow_up_due_at',
            ]);
        });

        Schema::table('staff', function (Blueprint $table) {
            $table->dropColumn(['role', 'is_active', 'joined_at']);
        });

        Schema::table('services', function (Blueprint $table) {
            $table->dropColumn(['category', 'gst_rate', 'active']);
        });

        Schema::table('branches', function (Blueprint $table) {
            $table->dropColumn([
                'code',
                'gst_number',
                'phone',
                'city',
                'state',
                'default_language',
                'active',
            ]);
        });
    }
};
