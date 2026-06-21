<?php

namespace App\Jobs;

use App\Models\Outlet;
use App\Models\OutletSetting;
use App\Services\AnalyticsService;
use App\Services\WhatsAppService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Mail;

class SendEodReportJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct(public int $outletId) {}

    public function handle(AnalyticsService $analytics, WhatsAppService $wa): void
    {
        $outlet  = Outlet::find($this->outletId);
        $setting = OutletSetting::where('outlet_id', $this->outletId)->first();

        if (! $outlet || ! $setting) {
            return;
        }

        $today = now()->toDateString();
        $data  = $analytics->getDashboard($this->outletId, $today, $today);
        $summary = $data['summary'];

        $revenue   = 'Rp ' . number_format($summary['total_revenue'] ?? 0, 0, ',', '.');
        $orders    = $summary['total_orders'] ?? 0;
        $avgOrder  = 'Rp ' . number_format($summary['avg_order_value'] ?? 0, 0, ',', '.');

        $message = "📊 *Laporan EOD — {$outlet->name}*\n"
            . "📅 {$today}\n\n"
            . "💰 Revenue: *{$revenue}*\n"
            . "📦 Order: *{$orders}*\n"
            . "🧾 Rata-rata: *{$avgOrder}*\n\n"
            . "_Laporan otomatis dari LARIS_";

        // Send via WA if token configured
        if ($setting->whatsapp_token && $setting->whatsapp_sender) {
            $wa->send($setting->whatsapp_token, $setting->whatsapp_sender, $message);
        }

        // Send via email if address configured
        if ($setting->eod_report_email) {
            $this->sendEmail($setting->eod_report_email, $outlet->name, $today, $data);
        }
    }

    private function sendEmail(string $to, string $outletName, string $date, array $data): void
    {
        $summary = $data['summary'];
        $topItems = collect($data['top_items'] ?? [])->take(5);

        $html = view('emails.eod-report', compact('outletName', 'date', 'summary', 'topItems'))->render();

        Mail::html($html, fn ($m) => $m
            ->to($to)
            ->subject("[LARIS] Laporan EOD — {$outletName} — {$date}")
        );
    }
}
