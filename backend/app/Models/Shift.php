<?php

namespace App\Models;

use App\Traits\BelongsToTenant;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Shift extends Model
{
    use BelongsToTenant;

    protected $fillable = ['outlet_id', 'tenant_id', 'name', 'start_time', 'end_time'];

    public function outlet(): BelongsTo
    {
        return $this->belongsTo(Outlet::class);
    }

    public function assignments(): HasMany
    {
        return $this->hasMany(ShiftAssignment::class);
    }
}
