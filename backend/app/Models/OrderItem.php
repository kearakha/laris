<?php

namespace App\Models;

use App\Enums\OrderItemStatus;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class OrderItem extends Model
{
    protected $fillable = [
        'order_id', 'menu_item_id', 'menu_item_name', 'menu_item_price',
        'quantity', 'subtotal', 'notes', 'status',
    ];

    protected $casts = [
        'menu_item_price' => 'decimal:2',
        'subtotal' => 'decimal:2',
        'status' => OrderItemStatus::class,
    ];

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    public function menuItem(): BelongsTo
    {
        return $this->belongsTo(MenuItem::class);
    }

    public function variantOptions(): HasMany
    {
        return $this->hasMany(OrderItemVariantOption::class);
    }

    public function addons(): HasMany
    {
        return $this->hasMany(OrderItemAddon::class);
    }
}
