<?php

namespace App\Models;

use App\Traits\BelongsToTenant;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Review extends Model
{
    use BelongsToTenant;

    protected $fillable = [
        'tenant_id', 'outlet_id', 'order_id', 'customer_id',
        'overall_rating', 'food_rating', 'service_rating', 'ambiance_rating',
        'reviewer_name', 'comment', 'is_published', 'reply', 'replied_at',
    ];

    protected $casts = [
        'overall_rating' => 'integer',
        'food_rating' => 'integer',
        'service_rating' => 'integer',
        'ambiance_rating' => 'integer',
        'is_published' => 'boolean',
        'replied_at' => 'datetime',
    ];

    public function outlet(): BelongsTo
    {
        return $this->belongsTo(Outlet::class);
    }

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    public function menuItemReviews(): HasMany
    {
        return $this->hasMany(MenuItemReview::class);
    }
}
