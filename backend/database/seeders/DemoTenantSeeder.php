<?php

namespace Database\Seeders;

use App\Enums\UserRole;
use App\Models\Outlet;
use App\Models\OutletSetting;
use App\Models\SubscriptionPlan;
use App\Models\Tenant;
use App\Models\TenantSubscription;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DemoTenantSeeder extends Seeder
{
    public function run(): void
    {
        $plan = SubscriptionPlan::where('name', 'Pro')->first();

        $tenant = Tenant::firstOrCreate(
            ['slug' => 'demo'],
            [
                'name'                 => 'Demo Kafe',
                'email'                => 'owner@demokafe.com',
                'phone'                => '081234567890',
                'primary_color'        => '#F59E0B',
                'subscription_plan_id' => $plan?->id,
                'subscription_status'  => 'trial',
                'trial_ends_at'        => now()->addDays(30),
            ]
        );

        if ($plan) {
            TenantSubscription::firstOrCreate(
                ['tenant_id' => $tenant->id, 'plan_id' => $plan->id],
                [
                    'status'        => 'trial',
                    'billing_cycle' => 'monthly',
                    'started_at'    => now(),
                    'expires_at'    => now()->addDays(30),
                ]
            );
        }

        $outlet = Outlet::firstOrCreate(
            ['tenant_id' => $tenant->id, 'slug' => 'pusat'],
            [
                'name'      => 'Demo Kafe - Pusat',
                'address'   => 'Jl. Demo No. 1',
                'city'      => 'Jakarta',
                'phone'     => '021-12345678',
                'is_active' => true,
                'timezone'  => 'Asia/Jakarta',
            ]
        );

        OutletSetting::firstOrCreate(
            ['outlet_id' => $outlet->id],
            [
                'tenant_id'   => $tenant->id,
                'ppn_rate'    => 11,
                'kds_enabled' => true,
                'updated_at'  => now(),
            ]
        );

        $owner = User::firstOrCreate(
            ['email' => 'owner@demokafe.com'],
            [
                'tenant_id' => $tenant->id,
                'name'      => 'Owner Demo Kafe',
                'password'  => Hash::make('password'),
                'phone'     => '081234567890',
                'is_active' => true,
            ]
        );

        $owner->assignRole(UserRole::TenantOwner->value);

        // Kasir demo
        $kasir = User::firstOrCreate(
            ['email' => 'kasir@demokafe.com'],
            [
                'tenant_id' => $tenant->id,
                'outlet_id' => $outlet->id,
                'name'      => 'Kasir Demo',
                'password'  => Hash::make('password'),
                'is_active' => true,
            ]
        );

        $kasir->assignRole(UserRole::Kasir->value);
    }
}
