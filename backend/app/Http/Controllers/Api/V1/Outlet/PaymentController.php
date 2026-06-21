<?php

namespace App\Http\Controllers\Api\V1\Outlet;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Services\PaymentService;
use App\Services\VoucherService;
use App\Helpers\ApiResponse;
use App\Enums\PaymentMethod;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PaymentController extends Controller
{
    public function __construct(
        private PaymentService $paymentService,
        private VoucherService $voucherService,
    ) {}

    /**
     * GET /outlet/orders/{order}/payments
     */
    public function index(Order $order): JsonResponse
    {
        $payments = $order->payments()->latest()->get();

        return ApiResponse::success($payments, 'Payment list');
    }

    /**
     * POST /outlet/orders/{order}/payments
     * body: { method: 'cash'|'qris'|'transfer'|'card', amount_paid?: number }
     */
    public function store(Request $request, Order $order): JsonResponse
    {
        $validated = $request->validate([
            'method'      => 'required|in:cash,qris,transfer,card',
            'amount_paid' => 'required_if:method,cash|numeric|min:0',
        ]);

        $method = PaymentMethod::from($validated['method']);

        if ($method === PaymentMethod::Cash) {
            $payment = $this->paymentService->processCash($order, (float) $validated['amount_paid']);
            return ApiResponse::success($payment, 'Pembayaran cash berhasil');
        }

        // Non-cash: create Midtrans Snap transaction
        $result = $this->paymentService->createMidtransTransaction($order, $method);

        return ApiResponse::success($result, 'Snap token dibuat');
    }

    /**
     * POST /outlet/vouchers/validate
     * body: { code: string, order_total: number }
     */
    public function validateVoucher(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'code'        => 'required|string',
            'order_total' => 'required|numeric|min:0',
        ]);

        $result = $this->voucherService->validate($validated['code'], (float) $validated['order_total']);

        return ApiResponse::success($result, 'Voucher valid');
    }

    /**
     * POST /outlet/orders/{order}/apply-voucher
     * body: { code: string }
     */
    public function applyVoucher(Request $request, Order $order): JsonResponse
    {
        $validated = $request->validate(['code' => 'required|string']);

        $this->voucherService->apply($order, $validated['code']);

        return ApiResponse::success($order->fresh(), 'Voucher berhasil diaplikasikan');
    }
}
