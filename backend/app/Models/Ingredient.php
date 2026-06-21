<?php

namespace App\Models;

use App\Traits\BelongsToTenant;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Ingredient extends Model
{
    use BelongsToTenant, SoftDeletes;

    protected $fillable = [
        'tenant_id', 'outlet_id', 'name', 'unit',
        'current_stock', 'min_stock', 'cost_per_unit',
    ];

    protected $casts = [
        'current_stock' => 'decimal:3',
        'min_stock' => 'decimal:3',
        'cost_per_unit' => 'decimal:2',
    ];

    public function outlet(): BelongsTo
    {
        return $this->belongsTo(Outlet::class);
    }

    public function stockMovements(): HasMany
    {
        return $this->hasMany(StockMovement::class);
    }

    public function isLowStock(): bool
    {
        return $this->current_stock <= $this->min_stock;
    }
}
