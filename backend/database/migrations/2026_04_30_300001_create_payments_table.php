<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('payments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('order_id')->constrained()->cascadeOnDelete();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->string('method'); // cash/qris/transfer/card/loyalty_points
            $table->decimal('amount', 12, 2);
            $table->decimal('change_amount', 12, 2)->default(0);
            $table->string('gateway')->nullable(); // midtrans/xendit/manual
            $table->string('gateway_ref')->nullable();
            $table->string('gateway_status')->nullable();
            $table->string('status')->default('pending'); // pending/success/failed/refunded
            $table->json('gateway_response')->nullable();
            $table->timestamp('paid_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payments');
    }
};
