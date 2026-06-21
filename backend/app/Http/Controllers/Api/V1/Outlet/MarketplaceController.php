<?php

namespace App\Http\Controllers\Api\V1\Outlet;

use App\Helpers\ApiResponse;
use App\Http\Controllers\Controller;
use App\Models\MarketplaceIntegration;
use App\Services\MarketplaceService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MarketplaceController extends Controller
{
    public function __construct(private MarketplaceService $marketplace) {}

    public function index(Request $request): JsonResponse
    {
        $outletId = $request->header('X-Outlet-Id');
        $integrations = MarketplaceIntegration::where('outlet_id', $outletId)->get();

        $platforms = ['gofood', 'grabfood', 'shopeefood'];
        $result = collect($platforms)->map(function ($platform) use ($integrations) {
            $existing = $integrations->firstWhere('platform', $platform);
            return [
                'platform'       => $platform,
                'label'          => match ($platform) {
                    'gofood'     => 'GoFood',
                    'grabfood'   => 'GrabFood',
                    'shopeefood' => 'ShopeeFood',
                    default      => $platform,
                },
                'is_active'      => $existing?->is_active ?? false,
                'outlet_token'   => $existing?->outlet_token,
                'last_synced_at' => $existing?->last_synced_at,
                'configured'     => $existing !== null,
            ];
        });

        return ApiResponse::success($result, 'Marketplace integrations');
    }

    public function upsert(Request $request, string $platform): JsonResponse
    {
        $validated = $request->validate([
            'api_key'        => 'nullable|string',
            'webhook_secret' => 'nullable|string',
            'is_active'      => 'boolean',
        ]);

        $outletId = (int) $request->header('X-Outlet-Id');
        $tenantId = app('tenant')->id;

        $integration = $this->marketplace->upsertIntegration($outletId, $tenantId, $platform, $validated);

        return ApiResponse::success([
            'platform'     => $platform,
            'outlet_token' => $integration->outlet_token,
            'is_active'    => $integration->is_active,
            'webhook_url'  => url("/api/v1/webhooks/marketplace/{$platform}/{$integration->outlet_token}"),
        ], 'Integration saved');
    }
}
