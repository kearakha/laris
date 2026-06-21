<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([
            SubscriptionPlanSeeder::class,
            SuperAdminSeeder::class,
            DemoTenantSeeder::class,
            MenuSeeder::class,
            TableSeeder::class,
        ]);
    }
}
