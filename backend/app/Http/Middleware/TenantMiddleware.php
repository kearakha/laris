<?php

namespace App\Http\Middleware;

use App\Models\Tenant;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class TenantMiddleware
{
    public function handle(Request $request, Closure $next): Response
    {
        $tenant = null;
        $host = $request->getHost();
        $parts = explode('.', $host);

        // Try subdomain first
        if (count($parts) >= 3) {
            $tenant = Tenant::where('slug', $parts[0])->first();
        }

        // Dev fallback: use X-Tenant-Slug header or default to first tenant
        if (!$tenant) {
            $slug = $request->header('X-Tenant-Slug');
            if ($slug) {
                $tenant = Tenant::where('slug', $slug)->first();
            } elseif (app()->isLocal()) {
                $tenant = Tenant::first();
            }
        }

        if (!$tenant) {
            return response()->json(['success' => false, 'message' => 'Tenant tidak ditemukan.'], 404);
        }

        app()->instance('tenant', $tenant);

        return $next($request);
    }
}
