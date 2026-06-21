<?php

namespace App\Models;

use App\Enums\MenuItemTag as MenuItemTagEnum;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MenuItemTag extends Model
{
    protected $fillable = ['menu_item_id', 'tag'];

    protected $casts = ['tag' => MenuItemTagEnum::class];

    public function menuItem(): BelongsTo
    {
        return $this->belongsTo(MenuItem::class);
    }
}
