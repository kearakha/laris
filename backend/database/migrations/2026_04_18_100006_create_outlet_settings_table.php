<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('outlet_settings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('outlet_id')->unique()->constrained('outlets')->cascadeOnDelete();
            $table->foreignId('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->decimal('ppn_rate', 5, 2)->default(11);
            $table->boolean('ppn_inclusive')->default(false);
            $table->decimal('service_charge_rate', 5, 2)->default(0);
            $table->string('currency', 3)->default('IDR');
            $table->string('timezone')->default('Asia/Jakarta');
            $table->string('default_language', 5)->default('id');
            $table->text('receipt_header')->nullable();
            $table->text('receipt_footer')->nullable();
            $table->boolean('auto_print_receipt')->default(false);
            $table->boolean('kds_enabled')->default(true);
            $table->boolean('loyalty_enabled')->default(false);
            $table->boolean('reservation_enabled')->default(false);
            $table->timestamp('updated_at')->nullable();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('outlet_settings');
    }
};
