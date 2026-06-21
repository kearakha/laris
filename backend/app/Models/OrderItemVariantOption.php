<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class OrderItemVariantOption extends Model
{
    protected $fillable = ['order_item_id', 'variant_option_id', 'label', 'price_modifier'];

    protected $casts = ['price_modifier' => 'decimal:2'];

    public function orderItem(): BelongsTo
    {
        return $this->belongsTo(OrderItem::class);
    }
}
