<?php

namespace App\Services;

use App\Enums\OrderStatus;
use App\Enums\PaymentMethod;
use App\Enums\PaymentStatus;
use App\Models\Order;
use App\Services\WhatsAppNotificationService;
use App\Models\Payment;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;

class PaymentService
{
    /**
     * Process a cash payment — always succeeds immediately.
     */
    public function processCash(Order $order, float $amountPaid): Payment
    {
        return DB::transaction(function () use ($order, $amountPaid) {
            $change = max(0, $amountPaid - $order->total);

            $payment = Payment::create([
                'order_id'      => $order->id,
                'tenant_id'     => $order->tenant_id,
                'method'        => PaymentMethod::Cash,
                'amount'        => $order->total,
                'change_amount' => $change,
                'gateway'       => 'manual',
                'status'        => 'success',
                'paid_at'       => now(),
            ]);

            $order->update(['payment_status' => PaymentStatus::Paid]);

            // Auto-complete order on full cash payment
            if ($order->status !== OrderStatus::Completed) {
                $order->update(['status' => OrderStatus::Completed]);
                $order->refresh();
                app(LoyaltyService::class)->earnFromOrder($order);
                app(WhatsAppNotificationService::class)->sendReceipt($order);
            }

            return $payment;
        });
    }

    /**
     * Create Midtrans Snap token for QRIS / card / transfer.
     * Returns ['snap_token' => '...', 'redirect_url' => '...']
     */
    public function createMidtransTransaction(Order $order, PaymentMethod $method): array
    {
        $serverKey = config('services.midtrans.server_key');
        $isProduction = config('services.midtrans.is_production', false);
        $baseUrl = $isProduction
            ? 'https://app.midtrans.com/snap/v1/transactions'
            : 'https://app.sandbox.midtrans.com/snap/v1/transactions';

        $payload = [
            'transaction_details' => [
                'order_id'     => $order->order_number . '-' . time(),
                'gross_amount' => (int) round($order->total),
            ],
            'customer_details' => [
                'first_name' => $order->customer_name ?? 'Customer',
            ],
            'enabled_payments' => $this->mapPaymentMethods($method),
            'callbacks' => [
                'finish' => url("/order/{$order->table?->qr_code}/status/{$order->order_number}"),
            ],
        ];

        $response = Http::withBasicAuth($serverKey, '')
            ->post($baseUrl, $payload);

        if ($response->failed()) {
            throw new \RuntimeException('Midtrans error: ' . $response->body());
        }

        $data = $response->json();

        // Store pending payment record
        Payment::create([
            'order_id'    => $order->id,
            'tenant_id'   => $order->tenant_id,
            'method'      => $method,
            'amount'      => $order->total,
            'gateway'     => 'midtrans',
            'gateway_ref' => $data['token'] ?? null,
            'status'      => 'pending',
            'gateway_response' => $data,
        ]);

        return [
            'snap_token'   => $data['token'] ?? null,
            'redirect_url' => $data['redirect_url'] ?? null,
        ];
    }

    /**
     * Handle Midtrans webhook notification.
     */
    public function handleMidtransWebhook(array $notification): void
    {
        $orderId = explode('-', $notification['order_id'])[0]; // strip timestamp suffix
        $order = Order::withoutGlobalScopes()
            ->where('order_number', $orderId)
            ->firstOrFail();

        $payment = Payment::where('order_id', $order->id)
            ->where('gateway', 'midtrans')
            ->latest()
            ->first();

        if (!$payment) return;

        $transactionStatus = $notification['transaction_status'] ?? '';
        $fraudStatus = $notification['fraud_status'] ?? 'accept';

        $paymentStatus = match (true) {
            in_array($transactionStatus, ['capture', 'settlement']) && $fraudStatus === 'accept' => 'success',
            $transactionStatus === 'pending' => 'pending',
            in_array($transactionStatus, ['deny', 'cancel', 'expire']) => 'failed',
            default => 'pending',
        };

        $payment->update([
            'gateway_status'   => $transactionStatus,
            'status'           => $paymentStatus,
            'gateway_response' => $notification,
            'paid_at'          => $paymentStatus === 'success' ? now() : null,
        ]);

        if ($paymentStatus === 'success') {
            $order->update([
                'payment_status' => PaymentStatus::Paid,
                'status'         => OrderStatus::Completed,
            ]);
            $order->refresh();
            app(LoyaltyService::class)->earnFromOrder($order);
        }
    }

    private function mapPaymentMethods(PaymentMethod $method): array
    {
        return match ($method) {
            PaymentMethod::Qris     => ['gopay', 'qris', 'shopeepay'],
            PaymentMethod::Transfer => ['bank_transfer'],
            PaymentMethod::Card     => ['credit_card'],
            default                 => ['gopay', 'qris', 'bank_transfer', 'credit_card'],
        };
    }
}
