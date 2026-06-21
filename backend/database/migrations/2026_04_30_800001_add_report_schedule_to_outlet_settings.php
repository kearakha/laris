<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('outlet_settings', function (Blueprint $table) {
            $table->boolean('eod_report_enabled')->default(false)->after('wa_order_notify_enabled');
            $table->string('eod_report_email')->nullable()->after('eod_report_enabled');
            $table->boolean('weekly_report_enabled')->default(false)->after('eod_report_email');
            $table->unsignedTinyInteger('weekly_report_day')->default(1)->after('weekly_report_enabled'); // 1=Mon
            $table->string('weekly_report_email')->nullable()->after('weekly_report_day');
            $table->boolean('monthly_report_enabled')->default(false)->after('weekly_report_email');
            $table->string('monthly_report_email')->nullable()->after('monthly_report_enabled');
        });
    }

    public function down(): void
    {
        Schema::table('outlet_settings', function (Blueprint $table) {
            $table->dropColumn([
                'eod_report_enabled', 'eod_report_email',
                'weekly_report_enabled', 'weekly_report_day', 'weekly_report_email',
                'monthly_report_enabled', 'monthly_report_email',
            ]);
        });
    }
};
