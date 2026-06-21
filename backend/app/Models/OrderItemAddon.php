<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class OrderItemAddon extends Model
{
    protected $fillable = ['order_item_id', 'addon_id', 'name', 'price', 'quantity'];

    protected $casts = ['price' => 'decimal:2'];

    public function orderItem(): BelongsTo
    {
        return $this->belongsTo(OrderItem::class);
    }
}
