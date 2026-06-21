<?php

namespace App\Http\Controllers\Api\V1\Public;

use App\Enums\OrderType;
use App\Helpers\ApiResponse;
use App\Http\Controllers\Controller;
use App\Models\DiningTable;
use App\Models\MenuCategory;
use App\Models\Order;
use App\Models\Outlet;
use App\Services\OrderService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class QrOrderController extends Controller
{
    public function __construct(private OrderService $orderService) {}

    public function menu(string $outletSlug): JsonResponse
    {
        $outlet = Outlet::where('slug', $outletSlug)->where('is_active', true)->firstOrFail();

        $categories = MenuCategory::query()
            ->where('tenant_id', $outlet->tenant_id)
            ->where(fn ($q) => $q->where('outlet_id', $outlet->id)->orWhereNull('outlet_id'))
            ->where('is_active', true)
            ->with(['menuItems' => fn ($q) => $q->where('is_available', true)
                ->with(['variants.options', 'addons', 'tags'])
                ->orderBy('sort_order')
            ])
            ->orderBy('sort_order')
            ->get();

        return ApiResponse::success([
            'outlet' => [
                'id' => $outlet->id,
                'name' => $outlet->name,
                'slug' => $outlet->slug,
                'logo' => $outlet->logo,
            ],
            'categories' => $categories,
        ], 'Menu berhasil diambil');
    }

    public function tableInfo(string $qrToken): JsonResponse
    {
        $table = DiningTable::with('outlet')
            ->where('qr_code', $qrToken)
            ->whereNull('deleted_at')
            ->firstOrFail();

        return ApiResponse::success([
            'table' => [
                'id' => $table->id,
                'name' => $table->name,
                'capacity' => $table->capacity,
                'status' => $table->status,
                'qr_code' => $table->qr_code,
            ],
            'outlet' => [
                'id' => $table->outlet->id,
                'name' => $table->outlet->name,
                'slug' => $table->outlet->slug,
                'logo' => $table->outlet->logo,
            ],
        ], 'Info meja berhasil diambil');
    }

    public function placeOrder(Request $request, string $qrToken): JsonResponse
    {
        $table = DiningTable::where('qr_code', $qrToken)->whereNull('deleted_at')->firstOrFail();

        $request->validate([
            'customer_name' => 'required|string|max:100',
            'notes' => 'nullable|string|max:500',
            'items' => 'required|array|min:1',
            'items.*.menu_item_id' => 'required|exists:menu_items,id',
            'items.*.quantity' => 'required|integer|min:1',
            'items.*.notes' => 'nullable|string|max:255',
            'items.*.variant_options' => 'nullable|array',
            'items.*.variant_options.*' => 'integer|exists:menu_item_variant_options,id',
            'items.*.addons' => 'nullable|array',
            'items.*.addons.*' => 'integer|exists:menu_item_addons,id',
        ]);

        // Use system user (first super_admin) as created_by for QR orders
        $systemUserId = \App\Models\User::role('super_admin')->value('id') ?? 1;

        $order = $this->orderService->createOrder([
            'table_id' => $table->id,
            'type' => OrderType::DineIn->value,
            'customer_name' => $request->customer_name,
            'notes' => $request->notes,
            'items' => $request->items,
        ], $table->outlet_id, $systemUserId);

        return ApiResponse::success([
            'order_number' => $order->order_number,
            'status' => $order->status,
            'total' => $order->total,
            'estimated_time' => $order->items->max('menu_item_id') ? 20 : 15,
        ], 'Order berhasil dibuat', 201);
    }

    public function orderStatus(string $orderNumber): JsonResponse
    {
        $order = Order::withoutGlobalScopes()
            ->with(['items' => fn ($q) => $q->select('id', 'order_id', 'menu_item_name', 'quantity', 'status')])
            ->where('order_number', $orderNumber)
            ->firstOrFail();

        return ApiResponse::success([
            'order_number' => $order->order_number,
            'status' => $order->status,
            'payment_status' => $order->payment_status,
            'total' => $order->total,
            'items' => $order->items,
            'updated_at' => $order->updated_at,
        ], 'Status order berhasil diambil');
    }
}
