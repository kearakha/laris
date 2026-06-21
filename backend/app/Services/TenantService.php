<?php

namespace App\Services;

use App\Enums\UserRole;
use App\Models\Outlet;
use App\Models\OutletSetting;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class TenantService
{
    public function create(array $data): Tenant
    {
        return DB::transaction(function () use ($data) {
            $tenant = Tenant::create([
                'name'                 => $data['name'],
                'slug'                 => $data['slug'],
                'email'                => $data['email'],
                'phone'                => $data['phone'] ?? null,
                'primary_color'        => $data['primary_color'] ?? '#3B82F6',
                'subscription_plan_id' => $data['subscription_plan_id'] ?? null,
                'subscription_status'  => $data['subscription_status'] ?? 'trial',
                'trial_ends_at'        => $data['trial_ends_at'] ?? now()->addDays(14),
            ]);

            $owner = User::create([
                'tenant_id' => $tenant->id,
                'name'      => $data['owner_name'],
                'email'     => $data['owner_email'],
                'password'  => Hash::make($data['owner_password']),
                'phone'     => $data['owner_phone'] ?? null,
                'is_active' => true,
            ]);

            $owner->assignRole(UserRole::TenantOwner->value);

            return $tenant->load(['subscriptionPlan', 'users']);
        });
    }

    public function update(Tenant $tenant, array $data): Tenant
    {
        $tenant->update([
            'name'                 => $data['name'],
            'slug'                 => $data['slug'],
            'email'                => $data['email'],
            'phone'                => $data['phone'] ?? $tenant->phone,
            'primary_color'        => $data['primary_color'] ?? $tenant->primary_color,
            'subscription_plan_id' => $data['subscription_plan_id'] ?? $tenant->subscription_plan_id,
            'subscription_status'  => $data['subscription_status'] ?? $tenant->subscription_status,
            'trial_ends_at'        => $data['trial_ends_at'] ?? $tenant->trial_ends_at,
        ]);

        return $tenant->fresh(['subscriptionPlan']);
    }
}
