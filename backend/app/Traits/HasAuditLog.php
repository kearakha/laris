<?php

namespace App\Traits;

use App\Models\AuditLog;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Request;

trait HasAuditLog
{
    protected static function bootHasAuditLog(): void
    {
        static::updated(function ($model) {
            $dirty = $model->getDirty();
            if (empty($dirty)) {
                return;
            }

            $oldValues = array_intersect_key($model->getOriginal(), $dirty);

            AuditLog::create([
                'tenant_id'   => $model->tenant_id ?? (app()->bound('tenant') ? app('tenant')->id : null),
                'user_id'     => Auth::id(),
                'action'      => 'updated',
                'model_type'  => get_class($model),
                'model_id'    => $model->getKey(),
                'old_values'  => $oldValues,
                'new_values'  => $dirty,
                'ip_address'  => Request::ip(),
                'user_agent'  => Request::userAgent(),
            ]);
        });

        static::deleted(function ($model) {
            AuditLog::create([
                'tenant_id'   => $model->tenant_id ?? (app()->bound('tenant') ? app('tenant')->id : null),
                'user_id'     => Auth::id(),
                'action'      => 'deleted',
                'model_type'  => get_class($model),
                'model_id'    => $model->getKey(),
                'old_values'  => $model->toArray(),
                'new_values'  => null,
                'ip_address'  => Request::ip(),
                'user_agent'  => Request::userAgent(),
            ]);
        });
    }
}
