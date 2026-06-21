<?php

namespace App\Http\Controllers\Api\V1\Public;

use App\Helpers\ApiResponse;
use App\Http\Controllers\Controller;
use App\Services\PaymentService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class MidtransWebhookController extends Controller
{
    public function __construct(private PaymentService $paymentService) {}

    public function handle(Request $request): JsonResponse
    {
        $notification = $request->all();

        // Verify signature
        $serverKey = config('services.midtrans.server_key');
        $orderId = $notification['order_id'] ?? '';
        $statusCode = $notification['status_code'] ?? '';
        $grossAmount = $notification['gross_amount'] ?? '';
        $signatureKey = hash('sha512', $orderId . $statusCode . $grossAmount . $serverKey);

        if ($signatureKey !== ($notification['signature_key'] ?? '')) {
            return ApiResponse::error('Invalid signature', 403);
        }

        try {
            $this->paymentService->handleMidtransWebhook($notification);
        } catch (\Exception $e) {
            Log::error('Midtrans webhook error: ' . $e->getMessage(), $notification);
        }

        return ApiResponse::success(null, 'OK');
    }
}
