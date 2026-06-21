<?php

namespace App\Models;

use App\Traits\BelongsToTenant;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Campaign extends Model
{
    use BelongsToTenant;

    protected $fillable = [
        'tenant_id', 'outlet_id', 'created_by', 'name',
        'segment', 'channel', 'message', 'status',
        'target_count', 'sent_count', 'failed_count', 'sent_at',
    ];

    protected $casts = [
        'sent_at' => 'datetime',
    ];

    public function outlet(): BelongsTo
    {
        return $this->belongsTo(Outlet::class);
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function logs(): HasMany
    {
        return $this->hasMany(CampaignLog::class);
    }
}
