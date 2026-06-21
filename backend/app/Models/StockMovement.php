<?php

namespace App\Models;

use App\Enums\StockMovementType;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StockMovement extends Model
{
    protected $fillable = [
        'outlet_id', 'tenant_id', 'ingredient_id', 'type', 'quantity',
        'cost_per_unit', 'reference_type', 'reference_id', 'notes', 'created_by',
    ];

    protected $casts = [
        'type' => StockMovementType::class,
        'quantity' => 'decimal:3',
        'cost_per_unit' => 'decimal:2',
    ];

    public function ingredient(): BelongsTo
    {
        return $this->belongsTo(Ingredient::class);
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
