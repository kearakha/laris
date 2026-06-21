<?php

namespace App\Console\Commands;

use App\Jobs\SendEodReportJob;
use App\Models\OutletSetting;
use Illuminate\Console\Command;

class SendScheduledReports extends Command
{
    protected $signature   = 'reports:send-scheduled {type=eod : eod|weekly|monthly}';
    protected $description = 'Send scheduled reports (EOD/weekly/monthly) to configured outlets';

    public function handle(): void
    {
        $type = $this->argument('type');

        $query = match ($type) {
            'eod'     => OutletSetting::where('eod_report_enabled', true),
            'weekly'  => OutletSetting::where('weekly_report_enabled', true)
                            ->where('weekly_report_day', now()->dayOfWeek ?: 7),
            'monthly' => OutletSetting::where('monthly_report_enabled', true),
            default   => null,
        };

        if (! $query) {
            $this->error("Unknown type: {$type}");
            return;
        }

        $settings = $query->get();
        $count    = 0;

        foreach ($settings as $setting) {
            SendEodReportJob::dispatch($setting->outlet_id);
            $count++;
        }

        $this->info("Dispatched {$count} {$type} report jobs.");
    }
}
