<?php

namespace App\Models;

use App\Traits\BelongsToTenant;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;

class Outlet extends Model
{
    use SoftDeletes, BelongsToTenant;

    protected $fillable = [
        'tenant_id',
        'name',
        'slug',
        'address',
        'city',
        'phone',
        'email',
        'logo',
        'is_active',
        'timezone',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function settings(): HasOne
    {
        return $this->hasOne(OutletSetting::class);
    }

    public function users(): HasMany
    {
        return $this->hasMany(User::class);
    }
}
