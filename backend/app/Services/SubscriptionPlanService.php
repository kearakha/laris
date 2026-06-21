<?php

namespace App\Services;

use App\Models\SubscriptionPlan;

class SubscriptionPlanService
{
    public function create(array $data): SubscriptionPlan
    {
        return SubscriptionPlan::create($data);
    }

    public function update(SubscriptionPlan $plan, array $data): SubscriptionPlan
    {
        $plan->update($data);
        return $plan->fresh();
    }

    public function delete(SubscriptionPlan $plan): void
    {
        // Prevent delete if active tenants exist
        if ($plan->tenants()->whereIn('subscription_status', ['active', 'trial'])->exists()) {
            throw new \RuntimeException('Tidak bisa menghapus plan yang masih digunakan oleh tenant aktif.');
        }

        $plan->delete();
    }
}
