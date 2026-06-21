<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MenuItemReview extends Model
{
    public $timestamps = false;

    protected $fillable = ['review_id', 'menu_item_id', 'rating'];

    protected $casts = ['rating' => 'integer'];

    public function review(): BelongsTo
    {
        return $this->belongsTo(Review::class);
    }

    public function menuItem(): BelongsTo
    {
        return $this->belongsTo(MenuItem::class);
    }
}
