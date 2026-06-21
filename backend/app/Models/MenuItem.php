<?php

namespace App\Models;

use App\Traits\BelongsToTenant;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MenuItem extends Model
{
    use BelongsToTenant, SoftDeletes;

    protected $fillable = [
        'tenant_id', 'outlet_id', 'category_id', 'name', 'name_en', 'slug',
        'description', 'description_en', 'image', 'base_price', 'is_available', 'is_featured',
        'preparation_time', 'sort_order',
    ];

    protected $casts = [
        'base_price' => 'decimal:2',
        'is_available' => 'boolean',
        'is_featured' => 'boolean',
    ];

    public function category(): BelongsTo
    {
        return $this->belongsTo(MenuCategory::class, 'category_id');
    }

    public function outlet(): BelongsTo
    {
        return $this->belongsTo(Outlet::class);
    }

    public function variants(): HasMany
    {
        return $this->hasMany(MenuItemVariant::class);
    }

    public function addons(): HasMany
    {
        return $this->hasMany(MenuItemAddon::class);
    }

    public function tags(): HasMany
    {
        return $this->hasMany(MenuItemTag::class);
    }

    public function ingredients(): BelongsToMany
    {
        return $this->belongsToMany(Ingredient::class, 'menu_item_ingredients')
            ->withPivot('quantity_used');
    }

    public function menuItemIngredients(): HasMany
    {
        return $this->hasMany(MenuItemIngredient::class);
    }

    public function calculateHpp(): float
    {
        return $this->menuItemIngredients()
            ->with('ingredient')
            ->get()
            ->sum(fn ($r) => (float) $r->quantity_used * (float) $r->ingredient->cost_per_unit);
    }
}
