<?php

namespace App\Services;

use App\Models\Order;
use App\Models\OutletSetting;
use Illuminate\Support\Facades\Log;

class WhatsAppNotificationService
{
    public function __construct(private WhatsAppService $wa) {}

    public function sendReceipt(Order $order): void
    {
        $setting = OutletSetting::where('outlet_id', $order->outlet_id)->first();

        if (! $setting?->wa_receipt_enabled || empty($setting->whatsapp_token)) {
            return;
        }

        // Get customer phone — from customer relation or order customer_name (no phone available)
        $phone = $order->customer?->phone ?? null;
        if (! $phone) {
            return;
        }

        $outletName = $order->outlet?->name ?? 'Outlet';

        $this->wa->sendReceipt(
            $setting->whatsapp_token,
            $phone,
            $order->order_number,
            (float) $order->total,
            $outletName,
        );
    }

    public function sendOrderReady(Order $order): void
    {
        $setting = OutletSetting::where('outlet_id', $order->outlet_id)->first();

        if (! $setting?->wa_order_notify_enabled || empty($setting->whatsapp_token)) {
            return;
        }

        $phone = $order->customer?->phone ?? null;
        if (! $phone) {
            return;
        }

        $this->wa->sendOrderReady(
            $setting->whatsapp_token,
            $phone,
            $order->order_number,
            $order->outlet?->name ?? 'Outlet',
        );
    }
}
