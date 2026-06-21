<?php

namespace Database\Seeders;

use App\Models\DiningTable;
use App\Models\Outlet;
use App\Models\Tenant;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class TableSeeder extends Seeder
{
    public function run(): void
    {
        $tenant = Tenant::where('slug', 'demo')->first();
        if (!$tenant) return;

        $outlet = Outlet::where('tenant_id', $tenant->id)->first();
        if (!$outlet) return;

        app()->instance('tenant', $tenant);

        for ($i = 1; $i <= 10; $i++) {
            DiningTable::create([
                'tenant_id' => $tenant->id,
                'outlet_id' => $outlet->id,
                'name' => "Meja {$i}",
                'capacity' => $i <= 6 ? 4 : 6,
                'qr_code' => Str::uuid()->toString(),
                'status' => 'available',
            ]);
        }
    }
}
