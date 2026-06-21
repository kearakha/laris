<?php

namespace App\Models;

use App\Traits\BelongsToTenant;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StockTransfer extends Model
{
    use BelongsToTenant;

    protected $fillable = [
        'tenant_id', 'from_outlet_id', 'to_outlet_id', 'ingredient_id',
        'quantity', 'status', 'requested_by', 'approved_by', 'notes', 'completed_at',
    ];

    protected $casts = [
        'quantity'     => 'decimal:3',
        'completed_at' => 'datetime',
    ];

    public function fromOutlet(): BelongsTo
    {
        return $this->belongsTo(Outlet::class, 'from_outlet_id');
    }

    public function toOutlet(): BelongsTo
    {
        return $this->belongsTo(Outlet::class, 'to_outlet_id');
    }

    public function ingredient(): BelongsTo
    {
        return $this->belongsTo(Ingredient::class);
    }

    public function requestedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'requested_by');
    }
}
