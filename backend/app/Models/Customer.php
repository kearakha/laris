<?php

namespace App\Models;

use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Laravel\Sanctum\HasApiTokens;

class Customer extends Authenticatable
{
    use HasApiTokens, SoftDeletes;

    protected $fillable = [
        'tenant_id', 'name', 'email', 'phone', 'password',
        'avatar', 'loyalty_points', 'loyalty_tier',
        'date_of_birth', 'gender',
    ];

    protected $hidden = ['password', 'remember_token'];

    protected $casts = [
        'loyalty_points' => 'integer',
        'date_of_birth' => 'date',
        'email_verified_at' => 'datetime',
    ];

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function loyaltyTransactions(): HasMany
    {
        return $this->hasMany(CustomerLoyaltyTransaction::class);
    }

    public function reservations(): HasMany
    {
        return $this->hasMany(Reservation::class);
    }

    public function reviews(): HasMany
    {
        return $this->hasMany(Review::class);
    }

    public function recalculateTier(): void
    {
        $points = $this->loyalty_points;
        $this->loyalty_tier = match (true) {
            $points >= 20000 => 'platinum',
            $points >= 5000  => 'gold',
            $points >= 1000  => 'silver',
            default          => 'bronze',
        };
        $this->saveQuietly();
    }
}
