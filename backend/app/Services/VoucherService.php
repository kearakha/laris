<?php

namespace App\Services;

use App\Models\Order;
use App\Models\Voucher;
use App\Models\VoucherUsage;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class VoucherService
{
    /**
     * Validate voucher code and return discount calculation.
     */
    public function validate(string $code, float $orderTotal): array
    {
        $voucher = Voucher::where('code', strtoupper($code))->first();

        if (!$voucher) {
            throw ValidationException::withMessages(['code' => ['Kode voucher tidak ditemukan.']]);
        }

        if (!$voucher->isValid($orderTotal)) {
            throw ValidationException::withMessages(['code' => ['Voucher tidak valid atau sudah tidak bisa digunakan.']]);
        }

        $discount = $voucher->calculateDiscount($orderTotal);

        return [
            'voucher_id'      => $voucher->id,
            'code'            => $voucher->code,
            'name'            => $voucher->name,
            'type'            => $voucher->type->value,
            'discount_amount' => round($discount, 2),
            'final_total'     => round($orderTotal - $discount, 2),
        ];
    }

    /**
     * Apply voucher to an order and record usage.
     */
    public function apply(Order $order, string $code): void
    {
        DB::transaction(function () use ($order, $code) {
            $voucher = Voucher::where('code', strtoupper($code))->lockForUpdate()->firstOrFail();

            if (!$voucher->isValid($order->subtotal)) {
                throw ValidationException::withMessages(['code' => ['Voucher tidak lagi valid.']]);
            }

            $discount = $voucher->calculateDiscount($order->subtotal);
            $newTotal = max(0, $order->total - $discount);

            $order->update([
                'voucher_id'      => $voucher->id,
                'discount_amount' => $discount,
                'total'           => $newTotal,
            ]);

            VoucherUsage::create([
                'voucher_id'      => $voucher->id,
                'order_id'        => $order->id,
                'customer_id'     => $order->customer_id,
                'discount_amount' => $discount,
                'used_at'         => now(),
            ]);

            $voucher->increment('used_count');
        });
    }
}
