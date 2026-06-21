<?php

namespace App\Models;

use App\Traits\BelongsToTenant;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class OutletSetting extends Model
{
    use BelongsToTenant;

    public $timestamps = false;

    protected $fillable = [
        'outlet_id',
        'tenant_id',
        'ppn_rate',
        'ppn_inclusive',
        'service_charge_rate',
        'currency',
        'timezone',
        'default_language',
        'receipt_header',
        'receipt_footer',
        'auto_print_receipt',
        'kds_enabled',
        'loyalty_enabled',
        'reservation_enabled',
        'updated_at',
    ];

    protected $casts = [
        'ppn_inclusive'      => 'boolean',
        'auto_print_receipt' => 'boolean',
        'kds_enabled'        => 'boolean',
        'loyalty_enabled'    => 'boolean',
        'reservation_enabled' => 'boolean',
        'ppn_rate'           => 'decimal:2',
        'service_charge_rate' => 'decimal:2',
        'updated_at'         => 'datetime',
    ];

    public function outlet(): BelongsTo
    {
        return $this->belongsTo(Outlet::class);
    }

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }
}
