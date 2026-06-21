<?php

namespace App\Repositories;

use App\Models\Tenant;
use Illuminate\Pagination\LengthAwarePaginator;

class TenantRepository
{
    public function paginate(array $filters = [], int $perPage = 15): LengthAwarePaginator
    {
        $query = Tenant::withTrashed()
            ->with(['subscriptionPlan'])
            ->withCount('outlets');

        if (!empty($filters['search'])) {
            $search = $filters['search'];
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%")
                  ->orWhere('slug', 'like', "%{$search}%");
            });
        }

        if (!empty($filters['status'])) {
            $query->where('subscription_status', $filters['status']);
        }

        if (isset($filters['trashed']) && $filters['trashed']) {
            $query->onlyTrashed();
        } elseif (!isset($filters['with_trashed'])) {
            $query->whereNull('deleted_at');
        }

        return $query->latest()->paginate($perPage);
    }

    public function findById(int $id, bool $withTrashed = false): ?Tenant
    {
        $query = Tenant::with(['subscriptionPlan', 'subscriptions', 'outlets']);

        if ($withTrashed) {
            $query->withTrashed();
        }

        return $query->find($id);
    }
}
