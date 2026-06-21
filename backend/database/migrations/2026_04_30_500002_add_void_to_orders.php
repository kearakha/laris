<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->unsignedBigInteger('voided_by')->nullable()->after('created_by');
            $table->timestamp('voided_at')->nullable()->after('voided_by');
            $table->text('void_reason')->nullable()->after('voided_at');
        });

        Schema::table('payments', function (Blueprint $table) {
            $table->unsignedBigInteger('refunded_by')->nullable()->after('paid_at');
            $table->timestamp('refunded_at')->nullable()->after('refunded_by');
            $table->text('refund_reason')->nullable()->after('refunded_at');
        });
    }

    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropColumn(['voided_by', 'voided_at', 'void_reason']);
        });
        Schema::table('payments', function (Blueprint $table) {
            $table->dropColumn(['refunded_by', 'refunded_at', 'refund_reason']);
        });
    }
};
