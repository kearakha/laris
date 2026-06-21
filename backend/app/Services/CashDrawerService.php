<?php

namespace App\Services;

use App\Models\CashDrawer;
use App\Models\Order;
use App\Enums\PaymentStatus;
use Illuminate\Validation\ValidationException;

class CashDrawerService
{
    public function openShift(int $outletId, int $userId, float $openingCash, ?string $notes = null): CashDrawer
    {
        // Check no open shift already
        $existing = CashDrawer::where('outlet_id', $outletId)
            ->where('status', 'open')
            ->first();

        if ($existing) {
            throw ValidationException::withMessages([
                'shift' => 'Ada shift yang masih terbuka. Tutup shift sebelumnya dulu.',
            ]);
        }

        return CashDrawer::create([
            'outlet_id'    => $outletId,
            'tenant_id'    => app('tenant')->id,
            'opened_by'    => $userId,
            'opening_cash' => $openingCash,
            'opened_at'    => now(),
            'status'       => 'open',
            'notes'        => $notes,
        ]);
    }

    public function closeShift(CashDrawer $drawer, int $userId, float $closingCash, ?string $notes = null): CashDrawer
    {
        if ($drawer->status !== 'open') {
            throw ValidationException::withMessages(['shift' => 'Shift sudah ditutup']);
        }

        // Calculate expected cash: opening + all cash payments during shift
        $cashRevenue = Order::where('outlet_id', $drawer->outlet_id)
            ->where('payment_status', PaymentStatus::Paid)
            ->whereBetween('updated_at', [$drawer->opened_at, now()])
            ->whereHas('payments', fn ($q) => $q->where('method', 'cash')->where('status', 'success'))
            ->join('payments', 'orders.id', '=', 'payments.order_id')
            ->where('payments.method', 'cash')
            ->where('payments.status', 'success')
            ->sum('payments.amount');

        $expectedCash  = (float) $drawer->opening_cash + (float) $cashRevenue;
        $difference    = $closingCash - $expectedCash;

        $drawer->update([
            'closed_by'       => $userId,
            'closing_cash'    => $closingCash,
            'expected_cash'   => $expectedCash,
            'cash_difference' => $difference,
            'closed_at'       => now(),
            'status'          => 'closed',
            'notes'           => $notes ?? $drawer->notes,
        ]);

        return $drawer->fresh();
    }

    public function getCurrentShift(int $outletId): ?CashDrawer
    {
        return CashDrawer::where('outlet_id', $outletId)
            ->where('status', 'open')
            ->with('openedBy:id,name')
            ->latest('opened_at')
            ->first();
    }

    public function getHistory(int $outletId, int $limit = 20): \Illuminate\Database\Eloquent\Collection
    {
        return CashDrawer::where('outlet_id', $outletId)
            ->with('openedBy:id,name', 'closedBy:id,name')
            ->latest('opened_at')
            ->limit($limit)
            ->get();
    }
}
