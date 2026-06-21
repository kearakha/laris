<?php

namespace App\Services;

use App\Enums\OrderStatus;
use App\Enums\PaymentStatus;
use App\Models\AuditLog;
use App\Models\Order;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class VoidService
{
    public function voidOrder(Order $order, User $supervisor, string $reason): void
    {
        if ($order->status === OrderStatus::Cancelled) {
            throw ValidationException::withMessages(['order' => 'Order sudah dibatalkan']);
        }

        if ($order->payment_status === PaymentStatus::Paid) {
            throw ValidationException::withMessages(['order' => 'Order sudah dibayar — gunakan refund']);
        }

        DB::transaction(function () use ($order, $supervisor, $reason) {
            $oldStatus = $order->status->value;

            $order->update([
                'status'      => OrderStatus::Cancelled,
                'voided_by'   => $supervisor->id,
                'voided_at'   => now(),
                'void_reason' => $reason,
            ]);

            AuditLog::create([
                'tenant_id'  => $order->tenant_id,
                'user_id'    => $supervisor->id,
                'action'     => 'void_order',
                'model_type' => Order::class,
                'model_id'   => $order->id,
                'old_values' => ['status' => $oldStatus],
                'new_values' => ['status' => 'cancelled', 'void_reason' => $reason],
                'ip_address' => request()->ip(),
                'user_agent' => request()->userAgent(),
            ]);
        });
    }

    public function refundOrder(Order $order, User $supervisor, string $reason): void
    {
        if ($order->payment_status !== PaymentStatus::Paid) {
            throw ValidationException::withMessages(['order' => 'Order belum dibayar']);
        }

        DB::transaction(function () use ($order, $supervisor, $reason) {
            $order->update([
                'status'         => OrderStatus::Cancelled,
                'payment_status' => PaymentStatus::Refunded,
                'voided_by'      => $supervisor->id,
                'voided_at'      => now(),
                'void_reason'    => $reason,
            ]);

            // Mark all payments as refunded
            $order->payments()->where('status', 'success')->update([
                'status'        => 'refunded',
                'refunded_by'   => $supervisor->id,
                'refunded_at'   => now(),
                'refund_reason' => $reason,
            ]);

            AuditLog::create([
                'tenant_id'  => $order->tenant_id,
                'user_id'    => $supervisor->id,
                'action'     => 'refund_order',
                'model_type' => Order::class,
                'model_id'   => $order->id,
                'old_values' => ['payment_status' => 'paid'],
                'new_values' => ['payment_status' => 'refunded', 'reason' => $reason],
                'ip_address' => request()->ip(),
                'user_agent' => request()->userAgent(),
            ]);
        });
    }
}
