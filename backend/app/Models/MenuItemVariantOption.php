<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MenuItemVariantOption extends Model
{
    protected $fillable = ['variant_id', 'label', 'price_modifier', 'is_default', 'sort_order'];

    protected $casts = [
        'price_modifier' => 'decimal:2',
        'is_default' => 'boolean',
    ];

    public function variant(): BelongsTo
    {
        return $this->belongsTo(MenuItemVariant::class, 'variant_id');
    }
}
