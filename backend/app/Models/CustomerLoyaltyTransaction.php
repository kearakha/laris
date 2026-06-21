<?php

namespace App\Models;

use App\Enums\LoyaltyTransactionType;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CustomerLoyaltyTransaction extends Model
{
    protected $fillable = [
        'customer_id', 'tenant_id', 'order_id', 'type', 'points', 'description',
    ];

    protected $casts = [
        'type' => LoyaltyTransactionType::class,
        'points' => 'integer',
    ];

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }
}
