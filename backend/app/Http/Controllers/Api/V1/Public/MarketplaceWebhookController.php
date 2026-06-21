<?php

namespace App\Http\Controllers\Api\V1\Public;

use App\Helpers\ApiResponse;
use App\Http\Controllers\Controller;
use App\Models\MarketplaceIntegration;
use App\Services\MarketplaceService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class MarketplaceWebhookController extends Controller
{
    public function __construct(private MarketplaceService $marketplace) {}

    public function handle(Request $request, string $platform, string $outletToken): JsonResponse
    {
        $integration = MarketplaceIntegration::where('outlet_token', $outletToken)
            ->where('platform', $platform)
            ->where('is_active', true)
            ->with('outlet')
            ->first();

        if (! $integration) {
            return ApiResponse::error('Integration not found or inactive', 404);
        }

        $payload = $request->all();

        Log::info("Marketplace webhook [{$platform}]", ['outlet_token' => $outletToken, 'payload' => $payload]);

        $result = match ($platform) {
            'gofood'    => $this->marketplace->handleGoFood($integration, $payload),
            'grabfood'  => $this->marketplace->handleGrabFood($integration, $payload),
            'shopeefood'=> $this->marketplace->handleShopeeFood($integration, $payload),
            default     => ['success' => false, 'reason' => 'Unknown platform'],
        };

        if (! $result['success']) {
            Log::warning("Marketplace order mapping failed [{$platform}]", $result);
            return ApiResponse::error($result['reason'] ?? 'Failed', 422);
        }

        $integration->update(['last_synced_at' => now()]);

        return ApiResponse::success($result, 'Order received');
    }
}
