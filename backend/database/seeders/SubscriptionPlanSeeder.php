<?php

namespace Database\Seeders;

use App\Models\SubscriptionPlan;
use Illuminate\Database\Seeder;

class SubscriptionPlanSeeder extends Seeder
{
    public function run(): void
    {
        $plans = [
            [
                'name'          => 'Basic',
                'price_monthly' => 99000,
                'price_yearly'  => 990000,
                'max_outlets'   => 1,
                'max_users'     => 5,
                'features'      => ['pos', 'kds', 'qr_order', 'basic_reports'],
                'is_active'     => true,
            ],
            [
                'name'          => 'Pro',
                'price_monthly' => 299000,
                'price_yearly'  => 2990000,
                'max_outlets'   => 5,
                'max_users'     => 20,
                'features'      => ['pos', 'kds', 'qr_order', 'inventory', 'loyalty', 'voucher', 'reservations', 'basic_reports', 'advanced_reports', 'pdf_export', 'excel_export'],
                'is_active'     => true,
            ],
            [
                'name'          => 'Enterprise',
                'price_monthly' => 799000,
                'price_yearly'  => 7990000,
                'max_outlets'   => 9999,
                'max_users'     => 9999,
                'features'      => ['pos', 'kds', 'qr_order', 'inventory', 'loyalty', 'voucher', 'reservations', 'basic_reports', 'advanced_reports', 'pdf_export', 'excel_export', 'api_access', 'central_kitchen', 'marketplace_sync', 'whatsapp'],
                'is_active'     => true,
            ],
        ];

        foreach ($plans as $plan) {
            SubscriptionPlan::firstOrCreate(['name' => $plan['name']], $plan);
        }
    }
}
