<?php

namespace Database\Seeders;

use App\Enums\UserRole;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\Models\Role;

class SuperAdminSeeder extends Seeder
{
    public function run(): void
    {
        // Create all roles
        $roles = [
            UserRole::SuperAdmin->value,
            UserRole::TenantOwner->value,
            UserRole::OutletManager->value,
            UserRole::Supervisor->value,
            UserRole::Kasir->value,
            UserRole::InventoryStaff->value,
            UserRole::KitchenStaff->value,
        ];

        foreach ($roles as $role) {
            Role::firstOrCreate(['name' => $role, 'guard_name' => 'web']);
        }

        // Create super admin user
        $admin = User::firstOrCreate(
            ['email' => env('SUPER_ADMIN_EMAIL', 'admin@larisapp.id')],
            [
                'name'      => 'Super Admin',
                'password'  => Hash::make(env('SUPER_ADMIN_PASSWORD', 'password')),
                'is_active' => true,
            ]
        );

        $admin->assignRole(UserRole::SuperAdmin->value);
    }
}
