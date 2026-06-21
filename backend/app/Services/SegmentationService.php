<?php

namespace App\Services;

use App\Models\Customer;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;

class SegmentationService
{
    /**
     * Available segments with labels.
     */
    public static function segments(): array
    {
        return [
            'all'         => 'Semua Customer',
            'churned'     => 'Tidak Order 30+ Hari',
            'birthday'    => 'Ulang Tahun Bulan Ini',
            'big_spender' => 'Big Spender (Top 20%)',
            'new'         => 'Customer Baru (7 hari)',
            'loyalty_gold'=> 'Loyalty Gold & Platinum',
        ];
    }

    /**
     * Get customers matching a segment for given tenant.
     */
    public function getCustomers(int $tenantId, string $segment): Collection
    {
        $base = Customer::where('tenant_id', $tenantId)
            ->whereNotNull('phone')
            ->where('phone', '!=', '');

        return match ($segment) {
            'churned'     => $this->churned($base),
            'birthday'    => $this->birthday($base),
            'big_spender' => $this->bigSpender($base, $tenantId),
            'new'         => $this->newCustomers($base),
            'loyalty_gold'=> $this->loyaltyGold($base),
            default       => $base->get(['id', 'name', 'phone', 'email', 'loyalty_tier']),
        };
    }

    public function countCustomers(int $tenantId, string $segment): int
    {
        return $this->getCustomers($tenantId, $segment)->count();
    }

    private function churned($query): Collection
    {
        // Customers who haven't ordered in 30+ days (or never)
        $activeIds = DB::table('orders')
            ->where('created_at', '>=', now()->subDays(30))
            ->whereNotNull('customer_id')
            ->pluck('customer_id');

        return $query->whereNotIn('id', $activeIds)
            ->get(['id', 'name', 'phone', 'email', 'loyalty_tier']);
    }

    private function birthday($query): Collection
    {
        return $query->whereNotNull('date_of_birth')
            ->whereMonth('date_of_birth', now()->month)
            ->get(['id', 'name', 'phone', 'email', 'loyalty_tier', 'date_of_birth']);
    }

    private function bigSpender($query, int $tenantId): Collection
    {
        // Top 20% by total spend
        $threshold = DB::table('orders')
            ->where('tenant_id', $tenantId)
            ->whereNotNull('customer_id')
            ->where('payment_status', 'paid')
            ->selectRaw('customer_id, SUM(total) as total_spend')
            ->groupBy('customer_id')
            ->orderByDesc('total_spend')
            ->get()
            ->when(fn ($c) => $c->count() > 0, function ($c) {
                $top20Index = max(1, (int) ceil($c->count() * 0.2));
                return $c->take($top20Index);
            })
            ->pluck('total_spend')
            ->last() ?? 0;

        $topIds = DB::table('orders')
            ->where('tenant_id', $tenantId)
            ->whereNotNull('customer_id')
            ->where('payment_status', 'paid')
            ->selectRaw('customer_id, SUM(total) as total_spend')
            ->groupBy('customer_id')
            ->havingRaw('SUM(total) >= ?', [$threshold])
            ->pluck('customer_id');

        return $query->whereIn('id', $topIds)
            ->get(['id', 'name', 'phone', 'email', 'loyalty_tier']);
    }

    private function newCustomers($query): Collection
    {
        return $query->where('created_at', '>=', now()->subDays(7))
            ->get(['id', 'name', 'phone', 'email', 'loyalty_tier', 'created_at']);
    }

    private function loyaltyGold($query): Collection
    {
        return $query->whereIn('loyalty_tier', ['gold', 'platinum'])
            ->get(['id', 'name', 'phone', 'email', 'loyalty_tier', 'loyalty_points']);
    }
}
