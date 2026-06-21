<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('reservations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('outlet_id')->constrained()->cascadeOnDelete();
            $table->unsignedBigInteger('customer_id')->nullable();
            $table->unsignedBigInteger('table_id')->nullable();
            $table->string('guest_name');
            $table->string('guest_phone');
            $table->unsignedTinyInteger('party_size');
            $table->date('date');
            $table->time('time');
            $table->string('status')->default('pending'); // pending/confirmed/seated/completed/cancelled/no_show
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('reservations');
    }
};
