<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureSubscriptionActive
{
    public function handle(Request $request, Closure $next): Response
    {
        if (!app()->bound('tenant')) {
            return response()->json(['success' => false, 'message' => 'Tenant tidak ditemukan.'], 404);
        }

        $tenant = app('tenant');

        if (!$tenant->isActive()) {
            return response()->json([
                'success' => false,
                'message' => 'Subscription tidak aktif. Silakan perbarui langganan Anda.',
            ], 403);
        }

        // Check trial expiry
        if ($tenant->subscription_status->value === 'trial' && $tenant->trial_ends_at?->isPast()) {
            return response()->json([
                'success' => false,
                'message' => 'Masa trial telah berakhir. Silakan berlangganan untuk melanjutkan.',
            ], 403);
        }

        return $next($request);
    }
}
