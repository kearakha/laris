<?php

namespace App\Models;

use App\Enums\TableStatus;
use App\Traits\BelongsToTenant;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DiningTable extends Model
{
    use BelongsToTenant, SoftDeletes;

    protected $table = 'tables';

    protected $fillable = [
        'outlet_id', 'tenant_id', 'name', 'capacity', 'qr_code', 'status',
    ];

    protected $casts = [
        'status' => TableStatus::class,
    ];

    public function outlet(): BelongsTo
    {
        return $this->belongsTo(Outlet::class);
    }

    public function orders(): HasMany
    {
        return $this->hasMany(Order::class, 'table_id');
    }
}
