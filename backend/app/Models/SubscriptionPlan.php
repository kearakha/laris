<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class SubscriptionPlan extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'name',
        'price_monthly',
        'price_yearly',
        'max_outlets',
        'max_users',
        'features',
        'is_active',
    ];

    protected $casts = [
        'features'      => 'array',
        'is_active'     => 'boolean',
        'price_monthly' => 'decimal:2',
        'price_yearly'  => 'decimal:2',
    ];

    public function tenants(): HasMany
    {
        return $this->hasMany(Tenant::class, 'subscription_plan_id');
    }

    public function subscriptions(): HasMany
    {
        return $this->hasMany(TenantSubscription::class, 'plan_id');
    }

    public function hasFeature(string $feature): bool
    {
        return in_array($feature, $this->features ?? []);
    }
}
