<?php

namespace App\Models;

use App\Traits\BelongsToTenant;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class WaitlistEntry extends Model
{
    use BelongsToTenant;

    protected $fillable = [
        'outlet_id', 'tenant_id', 'guest_name', 'guest_phone', 'party_size',
        'status', 'joined_at', 'notified_at', 'seated_at',
    ];

    protected $casts = [
        'party_size' => 'integer',
        'joined_at' => 'datetime',
        'notified_at' => 'datetime',
        'seated_at' => 'datetime',
    ];

    public function outlet(): BelongsTo
    {
        return $this->belongsTo(Outlet::class);
    }
}
