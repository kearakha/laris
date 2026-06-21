<?php

namespace App\Models;

use App\Traits\BelongsToTenant;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MarketplaceIntegration extends Model
{
    use BelongsToTenant;

    protected $fillable = [
        'tenant_id', 'outlet_id', 'platform', 'api_key',
        'webhook_secret', 'outlet_token', 'is_active', 'config', 'last_synced_at',
    ];

    protected $casts = [
        'config'        => 'array',
        'is_active'     => 'boolean',
        'last_synced_at' => 'datetime',
    ];

    protected $hidden = ['api_key', 'webhook_secret'];

    public function outlet(): BelongsTo
    {
        return $this->belongsTo(Outlet::class);
    }
}
