<?php

namespace App\Models;

use App\Traits\BelongsToTenant;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CashDrawer extends Model
{
    use BelongsToTenant;

    protected $fillable = [
        'outlet_id', 'tenant_id', 'opened_by', 'closed_by',
        'opening_cash', 'closing_cash', 'expected_cash', 'cash_difference',
        'opened_at', 'closed_at', 'status', 'notes',
    ];

    protected $casts = [
        'opening_cash'    => 'decimal:2',
        'closing_cash'    => 'decimal:2',
        'expected_cash'   => 'decimal:2',
        'cash_difference' => 'decimal:2',
        'opened_at'       => 'datetime',
        'closed_at'       => 'datetime',
    ];

    public function openedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'opened_by');
    }

    public function closedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'closed_by');
    }

    public function outlet(): BelongsTo
    {
        return $this->belongsTo(Outlet::class);
    }
}
