<?php

namespace App\Models;

use App\Enums\PaymentMethod;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Payment extends Model
{
    protected $fillable = [
        'order_id', 'tenant_id', 'method', 'amount', 'change_amount',
        'gateway', 'gateway_ref', 'gateway_status', 'status',
        'gateway_response', 'paid_at',
    ];

    protected $casts = [
        'method' => PaymentMethod::class,
        'amount' => 'decimal:2',
        'change_amount' => 'decimal:2',
        'gateway_response' => 'array',
        'paid_at' => 'datetime',
    ];

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }
}
