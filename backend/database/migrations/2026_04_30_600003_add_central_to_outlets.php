<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('outlets', function (Blueprint $table) {
            $table->boolean('is_central_kitchen')->default(false)->after('is_active');
        });

        // Stock transfer requests between outlets
        Schema::create('stock_transfers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('from_outlet_id')->constrained('outlets')->cascadeOnDelete();
            $table->foreignId('to_outlet_id')->constrained('outlets')->cascadeOnDelete();
            $table->foreignId('ingredient_id')->constrained()->cascadeOnDelete();
            $table->decimal('quantity', 10, 3);
            $table->string('status')->default('pending'); // pending/approved/completed/rejected
            $table->foreignId('requested_by')->constrained('users')->cascadeOnDelete();
            $table->unsignedBigInteger('approved_by')->nullable();
            $table->text('notes')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('stock_transfers');
        Schema::table('outlets', function (Blueprint $table) {
            $table->dropColumn('is_central_kitchen');
        });
    }
};
