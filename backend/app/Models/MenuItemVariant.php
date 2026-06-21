<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MenuItemVariant extends Model
{
    protected $fillable = ['menu_item_id', 'name', 'is_required'];

    protected $casts = ['is_required' => 'boolean'];

    public function menuItem(): BelongsTo
    {
        return $this->belongsTo(MenuItem::class);
    }

    public function options(): HasMany
    {
        return $this->hasMany(MenuItemVariantOption::class, 'variant_id')->orderBy('sort_order');
    }
}
