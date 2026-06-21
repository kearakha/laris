<?php

namespace App\Models;

use App\Enums\VoucherType;
use App\Traits\BelongsToTenant;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Voucher extends Model
{
    use BelongsToTenant, SoftDeletes;

    protected $fillable = [
        'tenant_id', 'code', 'name', 'type', 'value',
        'min_order_amount', 'max_discount_amount',
        'max_uses', 'used_count', 'is_active',
        'valid_from', 'valid_until',
    ];

    protected $casts = [
        'type' => VoucherType::class,
        'value' => 'decimal:2',
        'min_order_amount' => 'decimal:2',
        'max_discount_amount' => 'decimal:2',
        'is_active' => 'boolean',
        'valid_from' => 'datetime',
        'valid_until' => 'datetime',
    ];

    public function usages(): HasMany
    {
        return $this->hasMany(VoucherUsage::class);
    }

    public function isValid(float $orderTotal): bool
    {
        if (!$this->is_active) return false;
        if ($this->valid_from && now()->lt($this->valid_from)) return false;
        if ($this->valid_until && now()->gt($this->valid_until)) return false;
        if ($this->max_uses && $this->used_count >= $this->max_uses) return false;
        if ($orderTotal < $this->min_order_amount) return false;

        return true;
    }

    public function calculateDiscount(float $orderTotal): float
    {
        if ($this->type === VoucherType::Percentage) {
            $discount = $orderTotal * ($this->value / 100);
            if ($this->max_discount_amount) {
                $discount = min($discount, $this->max_discount_amount);
            }
            return $discount;
        }

        return min($this->value, $orderTotal);
    }
}
