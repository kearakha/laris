<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('cash_drawers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('outlet_id')->constrained()->cascadeOnDelete();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('opened_by')->constrained('users')->cascadeOnDelete();
            $table->unsignedBigInteger('closed_by')->nullable();
            $table->decimal('opening_cash', 12, 2)->default(0); // kas awal shift
            $table->decimal('closing_cash', 12, 2)->nullable(); // kas aktual saat tutup
            $table->decimal('expected_cash', 12, 2)->nullable(); // kas dari sistem
            $table->decimal('cash_difference', 12, 2)->nullable(); // selisih
            $table->timestamp('opened_at');
            $table->timestamp('closed_at')->nullable();
            $table->string('status')->default('open'); // open/closed
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('cash_drawers');
    }
};
