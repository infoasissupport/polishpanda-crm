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
        Schema::create('branches', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('location')->nullable();
            $table->timestamps();
        });

        Schema::create('services', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->text('desc')->nullable();
            $table->integer('price');
            $table->integer('duration');
            $table->string('icon')->nullable();
            $table->timestamps();
        });

        Schema::create('staff', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('phone');
            $table->string('branch');
            $table->string('shift');
            $table->string('attendance');
            $table->integer('jobs_today')->default(0);
            $table->integer('commission')->default(0);
            $table->float('performance')->default(5.0);
            $table->timestamps();
        });

        Schema::create('customers', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('phone');
            $table->string('plan')->default('none');
            $table->integer('points')->default(0);
            $table->string('last_visit')->default('Never');
            $table->boolean('starred')->default(false);
            $table->text('notes')->nullable();
            $table->string('membership')->nullable();
            $table->timestamps();
        });

        Schema::create('vehicles', function (Blueprint $table) {
            $table->id();
            $table->string('plate');
            $table->unsignedBigInteger('customer_id')->nullable();
            $table->string('brand');
            $table->string('colour');
            $table->string('type');
            $table->string('fuel');
            $table->string('last_wash')->nullable();
            $table->string('next')->nullable();
            $table->timestamps();
        });

        Schema::create('bookings', function (Blueprint $table) {
            $table->id();
            $table->integer('minutes');
            $table->string('time_label');
            $table->string('customer');
            $table->string('phone')->nullable();
            $table->string('vehicle')->nullable();
            $table->string('service');
            $table->string('source');
            $table->string('status');
            $table->timestamps();
        });

        Schema::create('job_cards', function (Blueprint $table) {
            $table->string('id')->primary(); // JC-XXXX
            $table->string('vehicle');
            $table->string('service');
            $table->string('staff');
            $table->string('bay')->nullable();
            $table->string('stage');
            $table->string('started_at')->nullable();
            $table->json('checklist');
            $table->text('note')->nullable();
            $table->integer('photos')->default(0);
            $table->string('signed_off_by')->nullable();
            $table->string('signed_off_time')->nullable();
            $table->timestamps();
        });

        Schema::create('invoices', function (Blueprint $table) {
            $table->string('id')->primary(); // INV-XXXX
            $table->string('customer');
            $table->string('phone');
            $table->string('service');
            $table->integer('amount');
            $table->string('method');
            $table->string('status');
            $table->string('date');
            $table->timestamps();
        });

        Schema::create('inventory_items', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('icon');
            $table->integer('stock');
            $table->integer('reorder');
            $table->string('supplier');
            $table->timestamps();
        });

        Schema::create('whatsapp_chats', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('initials');
            $table->string('msg');
            $table->string('time');
            $table->string('phone');
            $table->timestamps();
        });

        Schema::create('notifications', function (Blueprint $table) {
            $table->id();
            $table->string('icon');
            $table->string('title');
            $table->string('time');
            $table->boolean('read')->default(false);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('notifications');
        Schema::dropIfExists('whatsapp_chats');
        Schema::dropIfExists('inventory_items');
        Schema::dropIfExists('invoices');
        Schema::dropIfExists('job_cards');
        Schema::dropIfExists('bookings');
        Schema::dropIfExists('vehicles');
        Schema::dropIfExists('customers');
        Schema::dropIfExists('staff');
        Schema::dropIfExists('services');
        Schema::dropIfExists('branches');
    }
};
