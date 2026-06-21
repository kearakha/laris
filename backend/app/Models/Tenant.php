<?php

namespace App\Models;

use App\Enums\SubscriptionStatus;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Tenant extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'name',
        'slug',
        'email',
        'phone',
        'logo',
        'primary_color',
        'subscription_plan_id',
        'subscription_status',
        'trial_ends_at',
    ];

    protected $casts = [
        'trial_ends_at'       => 'datetime',
        'subscription_status' => SubscriptionStatus::class,
    ];

    public function subscriptionPlan(): BelongsTo
    {
        return $this->belongsTo(SubscriptionPlan::class);
    }

    public function subscriptions(): HasMany
    {
        return $this->hasMany(TenantSubscription::class);
    }

    public function activeSubscription()
    {
        return $this->subscriptions()->where('status', 'active')->latest()->first();
    }

    public function outlets(): HasMany
    {
        return $this->hasMany(Outlet::class);
    }

    public function users(): HasMany
    {
        return $this->hasMany(User::class);
    }

    public function invoices(): HasMany
    {
        return $this->hasMany(Invoice::class);
    }

    public function isActive(): bool
    {
        return in_array($this->subscription_status->value, ['active', 'trial']);
    }
}
