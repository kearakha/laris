<?php

namespace App\Models;

use App\Enums\BillingCycle;
use App\Enums\SubscriptionStatus;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class TenantSubscription extends Model
{
    protected $fillable = [
        'tenant_id',
        'plan_id',
        'status',
        'billing_cycle',
        'started_at',
        'expires_at',
        'cancelled_at',
    ];

    protected $casts = [
        'status'        => SubscriptionStatus::class,
        'billing_cycle' => BillingCycle::class,
        'started_at'    => 'datetime',
        'expires_at'    => 'datetime',
        'cancelled_at'  => 'datetime',
    ];

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function plan(): BelongsTo
    {
        return $this->belongsTo(SubscriptionPlan::class, 'plan_id');
    }

    public function invoices(): HasMany
    {
        return $this->hasMany(Invoice::class, 'subscription_id');
    }
}
