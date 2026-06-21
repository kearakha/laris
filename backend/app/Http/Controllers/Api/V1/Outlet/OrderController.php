<?php

namespace App\Http\Controllers\Api\V1\Outlet;

use App\Enums\OrderStatus;
use App\Helpers\ApiResponse;
use App\Http\Controllers\Controller;
use App\Http\Requests\Outlet\CreateOrderRequest;
use App\Http\Requests\Outlet\UpdateOrderStatusRequest;
use App\Models\Order;
use App\Models\OrderItem;
use App\Services\OrderService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class OrderController extends Controller
{
    public function __construct(private OrderService $orderService) {}

    public function index(Request $request): JsonResponse
    {
        $outletId = $request->header('X-Outlet-Id');

        $orders = Order::query()
            ->with(['table', 'items', 'createdBy:id,name'])
            ->when($outletId, fn ($q, $v) => $q->where('outlet_id', $v))
            ->when($request->status, fn ($q, $v) => $q->where('status', $v))
            ->when($request->type, fn ($q, $v) => $q->where('type', $v))
            ->when($request->table_id, fn ($q, $v) => $q->where('table_id', $v))
            ->when($request->date, fn ($q, $v) => $q->whereDate('created_at', $v))
            ->orderByDesc('created_at')
            ->paginate(30);

        return ApiResponse::paginated($orders, 'Order berhasil diambil');
    }

    public function store(CreateOrderRequest $request): JsonResponse
    {
        $outletId = $request->header('X-Outlet-Id');
        $order = $this->orderService->createOrder(
            $request->validated(),
            (int) $outletId,
            $request->user()->id
        );

        return ApiResponse::success($order, 'Order berhasil dibuat', 201);
    }

    public function show(Order $order): JsonResponse
    {
        $order->load(['table', 'items.variantOptions', 'items.addons', 'createdBy:id,name', 'splits']);

        return ApiResponse::success($order, 'Detail order berhasil diambil');
    }

    public function updateStatus(UpdateOrderStatusRequest $request, Order $order): JsonResponse
    {
        $order = $this->orderService->updateStatus($order, $request->status);

        return ApiResponse::success($order, 'Status order berhasil diperbarui');
    }

    public function updateItemStatus(Request $request, Order $order, OrderItem $orderItem): JsonResponse
    {
        $request->validate([
            'status' => 'required|in:pending,preparing,ready,served,cancelled',
        ]);

        $orderItem->update(['status' => $request->status]);

        return ApiResponse::success($orderItem, 'Status item berhasil diperbarui');
    }

    public function cancel(Request $request, Order $order): JsonResponse
    {
        $request->validate(['reason' => 'nullable|string|max:255']);

        if (in_array($order->status->value, ['completed', 'cancelled'])) {
            return ApiResponse::error('Order sudah selesai atau dibatalkan', 422);
        }

        $order = $this->orderService->updateStatus($order, OrderStatus::Cancelled->value);

        return ApiResponse::success($order, 'Order berhasil dibatalkan');
    }
}
