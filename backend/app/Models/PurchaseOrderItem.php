<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PurchaseOrderItem extends Model
{
    protected $fillable = [
        'purchase_order_id', 'ingredient_id',
        'quantity_ordered', 'quantity_received', 'unit_price', 'subtotal',
    ];

    protected $casts = [
        'quantity_ordered' => 'decimal:3',
        'quantity_received' => 'decimal:3',
        'unit_price' => 'decimal:2',
        'subtotal' => 'decimal:2',
    ];

    public function ingredient(): BelongsTo
    {
        return $this->belongsTo(Ingredient::class);
    }
}
