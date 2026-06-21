<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('waitlist_entries', function (Blueprint $table) {
            $table->id();
            $table->foreignId('outlet_id')->constrained()->cascadeOnDelete();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->string('guest_name');
            $table->string('guest_phone');
            $table->unsignedTinyInteger('party_size');
            $table->string('status')->default('waiting'); // waiting/notified/seated/left
            $table->timestamp('joined_at')->useCurrent();
            $table->timestamp('notified_at')->nullable();
            $table->timestamp('seated_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('waitlist_entries');
    }
};
