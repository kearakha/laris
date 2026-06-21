<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('orders', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->foreignId('outlet_id')->constrained('outlets')->cascadeOnDelete();
            $table->foreignId('table_id')->nullable()->constrained('tables')->nullOnDelete();
            $table->unsignedBigInteger('customer_id')->nullable();
            $table->string('order_number');
            $table->string('type')->default('dine_in');
            $table->string('status')->default('pending');
            $table->string('payment_status')->default('unpaid');
            $table->text('notes')->nullable();
            $table->decimal('subtotal', 12, 2)->default(0);
            $table->decimal('discount_amount', 12, 2)->default(0);
            $table->unsignedBigInteger('voucher_id')->nullable();
            $table->decimal('tax_amount', 12, 2)->default(0);
            $table->decimal('service_charge_amount', 12, 2)->default(0);
            $table->decimal('tips_amount', 12, 2)->default(0);
            $table->decimal('total', 12, 2)->default(0);
            $table->foreignId('created_by')->constrained('users');
            $table->string('customer_name')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->unique(['outlet_id', 'order_number']);
            $table->index(['tenant_id', 'outlet_id', 'status', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('orders');
    }
};
