<?php

namespace App\Models;

use App\Enums\ReservationStatus;
use App\Traits\BelongsToTenant;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Reservation extends Model
{
    use BelongsToTenant;

    protected $fillable = [
        'tenant_id', 'outlet_id', 'customer_id', 'table_id',
        'guest_name', 'guest_phone', 'party_size',
        'date', 'time', 'status', 'notes',
    ];

    protected $casts = [
        'status' => ReservationStatus::class,
        'date' => 'date',
        'party_size' => 'integer',
    ];

    public function outlet(): BelongsTo
    {
        return $this->belongsTo(Outlet::class);
    }

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    public function table(): BelongsTo
    {
        return $this->belongsTo(DiningTable::class, 'table_id');
    }
}
