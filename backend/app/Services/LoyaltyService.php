<?php

namespace App\Services;

use App\Enums\LoyaltyTransactionType;
use App\Models\Customer;
use App\Models\CustomerLoyaltyTransaction;
use App\Models\Order;
use Illuminate\Validation\ValidationException;

class LoyaltyService
{
    // Rp 1,000 = 1 point
    const EARN_RATE = 1000;

    // 1 point = Rp 100
    const REDEEM_RATE = 100;

    public function earnFromOrder(Order $order): void
    {
        if (! $order->customer_id) {
            return;
        }

        $customer = Customer::find($order->customer_id);
        if (! $customer) {
            return;
        }

        $points = (int) floor((float) $order->total / self::EARN_RATE);
        if ($points <= 0) {
            return;
        }

        CustomerLoyaltyTransaction::create([
            'customer_id' => $customer->id,
            'tenant_id'   => $order->tenant_id,
            'order_id'    => $order->id,
            'type'        => LoyaltyTransactionType::Earn,
            'points'      => $points,
            'description' => "Earn dari order #{$order->order_number}",
        ]);

        $customer->increment('loyalty_points', $points);
        $customer->recalculateTier();
    }

    public function redeemPoints(Customer $customer, int $points, Order $order): float
    {
        if ($points <= 0) {
            throw ValidationException::withMessages(['points' => 'Poin tidak valid']);
        }

        if ($customer->loyalty_points < $points) {
            throw ValidationException::withMessages(['points' => 'Poin tidak cukup']);
        }

        $discountAmount = $points * self::REDEEM_RATE;

        CustomerLoyaltyTransaction::create([
            'customer_id' => $customer->id,
            'tenant_id'   => $customer->tenant_id,
            'order_id'    => $order->id,
            'type'        => LoyaltyTransactionType::Redeem,
            'points'      => -$points,
            'description' => "Redeem untuk order #{$order->order_number}",
        ]);

        $customer->decrement('loyalty_points', $points);
        $customer->recalculateTier();

        return $discountAmount;
    }

    public function getBalance(Customer $customer): array
    {
        return [
            'points'         => $customer->loyalty_points,
            'tier'           => $customer->loyalty_tier,
            'redeem_value'   => $customer->loyalty_points * self::REDEEM_RATE,
            'next_tier'      => $this->nextTierInfo($customer->loyalty_points),
        ];
    }

    private function nextTierInfo(int $points): array
    {
        $tiers = ['bronze' => 0, 'silver' => 1000, 'gold' => 5000, 'platinum' => 20000];
        foreach (array_reverse($tiers, true) as $tier => $required) {
            if ($points >= $required) {
                $nextTiers = array_keys($tiers);
                $idx = array_search($tier, $nextTiers);
                if ($idx < count($nextTiers) - 1) {
                    $nextTier = $nextTiers[$idx + 1];
                    return [
                        'tier'           => $nextTier,
                        'points_needed'  => $tiers[$nextTier] - $points,
                    ];
                }
                return ['tier' => null, 'points_needed' => 0];
            }
        }
        return ['tier' => 'silver', 'points_needed' => 1000 - $points];
    }
}
