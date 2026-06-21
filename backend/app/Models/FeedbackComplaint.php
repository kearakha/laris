<?php

namespace App\Models;

use App\Traits\BelongsToTenant;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class FeedbackComplaint extends Model
{
    use BelongsToTenant;

    protected $fillable = [
        'tenant_id', 'outlet_id', 'customer_id', 'order_id',
        'category', 'description', 'contact_name', 'contact_phone',
        'status', 'resolution_notes', 'resolved_at',
    ];

    protected $casts = [
        'resolved_at' => 'datetime',
    ];

    public function outlet(): BelongsTo
    {
        return $this->belongsTo(Outlet::class);
    }

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }
}
