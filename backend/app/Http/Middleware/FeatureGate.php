<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class FeatureGate
{
    public function handle(Request $request, Closure $next, string $feature): Response
    {
        if (!app()->bound('tenant')) {
            return response()->json(['success' => false, 'message' => 'Tenant tidak ditemukan.'], 404);
        }

        $tenant = app('tenant');
        $plan = $tenant->subscriptionPlan;

        if (!$plan || !$plan->hasFeature($feature)) {
            return response()->json([
                'success' => false,
                'message' => "Fitur '{$feature}' tidak tersedia pada paket langganan Anda.",
            ], 403);
        }

        return $next($request);
    }
}
