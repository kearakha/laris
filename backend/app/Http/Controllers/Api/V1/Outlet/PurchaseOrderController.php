<?php

namespace App\Http\Controllers\Api\V1\Outlet;

use App\Helpers\ApiResponse;
use App\Http\Controllers\Controller;
use App\Models\PurchaseOrder;
use App\Services\InventoryService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PurchaseOrderController extends Controller
{
    public function __construct(private InventoryService $inventoryService) {}

    /**
     * GET /outlet/inventory/purchase-orders
     */
    public function index(Request $request): JsonResponse
    {
        $query = PurchaseOrder::with(['supplier:id,name', 'createdBy:id,name']);

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        $pos = $query->latest()->paginate(20);
        return ApiResponse::success($pos, 'Purchase order list');
    }

    /**
     * POST /outlet/inventory/purchase-orders
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'supplier_id' => 'required|exists:suppliers,id',
            'notes'       => 'nullable|string',
            'items'       => 'required|array|min:1',
            'items.*.ingredient_id' => 'required|exists:ingredients,id',
            'items.*.quantity_ordered' => 'required|numeric|min:0.001',
            'items.*.unit_price'       => 'required|numeric|min:0',
        ]);

        $outletId = (int) $request->header('X-Outlet-Id', app('tenant')->outlets()->value('id'));
        $poNumber = $this->inventoryService->generatePoNumber($outletId);

        $totalAmount = collect($validated['items'])->sum(
            fn ($item) => $item['quantity_ordered'] * $item['unit_price']
        );

        $po = PurchaseOrder::create([
            'outlet_id'    => $outletId,
            'supplier_id'  => $validated['supplier_id'],
            'po_number'    => $poNumber,
            'notes'        => $validated['notes'] ?? null,
            'total_amount' => $totalAmount,
            'created_by'   => auth()->id(),
        ]);

        foreach ($validated['items'] as $item) {
            $po->items()->create([
                'ingredient_id'    => $item['ingredient_id'],
                'quantity_ordered' => $item['quantity_ordered'],
                'unit_price'       => $item['unit_price'],
                'subtotal'         => $item['quantity_ordered'] * $item['unit_price'],
            ]);
        }

        return ApiResponse::success(
            $po->load(['supplier', 'items.ingredient']),
            'Purchase order dibuat',
            201
        );
    }

    /**
     * GET /outlet/inventory/purchase-orders/{po}
     */
    public function show(PurchaseOrder $purchaseOrder): JsonResponse
    {
        return ApiResponse::success(
            $purchaseOrder->load(['supplier', 'items.ingredient', 'createdBy:id,name']),
            'Purchase order detail'
        );
    }

    /**
     * POST /outlet/inventory/purchase-orders/{po}/receive
     * Receive items and update stock
     */
    public function receive(Request $request, PurchaseOrder $purchaseOrder): JsonResponse
    {
        $validated = $request->validate([
            'items'                            => 'required|array',
            'items.*.ingredient_id'            => 'required|exists:ingredients,id',
            'items.*.quantity_received'        => 'required|numeric|min:0',
        ]);

        $this->inventoryService->receivePurchaseOrder($purchaseOrder, $validated['items']);

        return ApiResponse::success(
            $purchaseOrder->fresh(['items.ingredient']),
            'Barang diterima, stok diupdate'
        );
    }

    /**
     * PATCH /outlet/inventory/purchase-orders/{po}/status
     */
    public function updateStatus(Request $request, PurchaseOrder $purchaseOrder): JsonResponse
    {
        $validated = $request->validate(['status' => 'required|in:draft,sent,cancelled']);
        $purchaseOrder->update(['status' => $validated['status']]);

        return ApiResponse::success($purchaseOrder, 'Status PO diupdate');
    }
}
