<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class WhatsAppService
{
    private const FONNTE_URL = 'https://api.fonnte.com/send';

    public function send(string $token, string $target, string $message): bool
    {
        try {
            $response = Http::withHeaders(['Authorization' => $token])
                ->post(self::FONNTE_URL, [
                    'target'  => $this->normalizePhone($target),
                    'message' => $message,
                ]);

            if (! $response->successful()) {
                Log::warning('WhatsApp send failed', ['status' => $response->status(), 'body' => $response->body()]);
                return false;
            }

            return true;
        } catch (\Throwable $e) {
            Log::error('WhatsApp send exception', ['error' => $e->getMessage()]);
            return false;
        }
    }

    /** Normalize phone: strip leading 0, add 62 */
    private function normalizePhone(string $phone): string
    {
        $phone = preg_replace('/\D/', '', $phone);
        if (str_starts_with($phone, '0')) {
            $phone = '62' . substr($phone, 1);
        } elseif (! str_starts_with($phone, '62')) {
            $phone = '62' . $phone;
        }
        return $phone;
    }

    public function sendReceipt(string $token, string $phone, string $orderNumber, float $total, string $outletName): bool
    {
        $message = "🧾 *Struk Digital — {$outletName}*\n\n"
            . "Order: *{$orderNumber}*\n"
            . 'Total: *Rp ' . number_format($total, 0, ',', '.') . "*\n\n"
            . 'Terima kasih sudah makan di ' . $outletName . ' 🙏';

        return $this->send($token, $phone, $message);
    }

    public function sendOrderReady(string $token, string $phone, string $orderNumber, string $outletName): bool
    {
        $message = "✅ *Order Siap — {$outletName}*\n\n"
            . "Pesanan #{$orderNumber} Anda sudah siap disajikan!\n"
            . 'Silakan menuju kasir atau tunggu pelayan kami 😊';

        return $this->send($token, $phone, $message);
    }
}
