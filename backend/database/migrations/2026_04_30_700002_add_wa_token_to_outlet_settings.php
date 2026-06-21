<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('outlet_settings', function (Blueprint $table) {
            $table->string('whatsapp_token')->nullable()->after('loyalty_enabled');
            $table->string('whatsapp_sender')->nullable()->after('whatsapp_token'); // sender phone number
            $table->boolean('wa_receipt_enabled')->default(false)->after('whatsapp_sender');
            $table->boolean('wa_order_notify_enabled')->default(false)->after('wa_receipt_enabled');
        });
    }

    public function down(): void
    {
        Schema::table('outlet_settings', function (Blueprint $table) {
            $table->dropColumn(['whatsapp_token', 'whatsapp_sender', 'wa_receipt_enabled', 'wa_order_notify_enabled']);
        });
    }
};
