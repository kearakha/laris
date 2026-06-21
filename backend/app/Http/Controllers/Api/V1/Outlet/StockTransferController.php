<?php

namespace App\Http\Controllers\Api\V1\Outlet;

use App\Http\Controllers\Controller;
use App\Helpers\ApiResponse;
use App\Models\Ingredient;
use App\Models\StockTransfer;
use App\Services\InventoryService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class StockTransferController extends Controller
{
    public function __construct(private InventoryService $inventoryService) {}

    public function index(Request $request)
    {
        $outletId = (int) ($request->header('X-Outlet-Id') ?? app('tenant')->outlets()->value('id'));

        $transfers = StockTransfer::where(function ($q) use ($outletId) {
                $q->where('from_outlet_id', $outletId)->orWhere('to_outlet_id', $outletId);
            })
            ->with('fromOutlet:id,name', 'toOutlet:id,name', 'ingredient:id,name,unit', 'requestedBy:id,name')
            ->latest()
            ->paginate(20);

        return ApiResponse::success($transfers);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'to_outlet_id'  => 'required|exists:outlets,id',
            'ingredient_id' => 'required|exists:ingredients,id',
            'quantity'      => 'required|numeric|min:0.001',
            'notes'         => 'nullable|string|max:500',
        ]);

        $fromOutletId = (int) ($request->header('X-Outlet-Id') ?? app('tenant')->outlets()->value('id'));

        // Verify sufficient stock
        $ingredient = Ingredient::where('id', $data['ingredient_id'])
            ->where('outlet_id', $fromOutletId)
            ->firstOrFail();

        if ((float) $ingredient->current_stock < $data['quantity']) {
            return ApiResponse::error('Stok tidak mencukupi untuk transfer', 422);
        }

        $transfer = StockTransfer::create([
            'tenant_id'      => app('tenant')->id,
            'from_outlet_id' => $fromOutletId,
            'to_outlet_id'   => $data['to_outlet_id'],
            'ingredient_id'  => $data['ingredient_id'],
            'quantity'       => $data['quantity'],
            'status'         => 'pending',
            'requested_by'   => $request->user()->id,
            'notes'          => $data['notes'] ?? null,
        ]);

        return ApiResponse::success($transfer->load('fromOutlet:id,name', 'toOutlet:id,name', 'ingredient:id,name,unit'), 'Transfer diminta', 201);
    }

    public function approve(Request $request, StockTransfer $stockTransfer)
    {
        if ($stockTransfer->status !== 'pending') {
            return ApiResponse::error('Transfer sudah diproses', 422);
        }

        DB::transaction(function () use ($stockTransfer, $request) {
            // Deduct from source
            $this->inventoryService->recordMovement(
                $stockTransfer->from_outlet_id,
                $stockTransfer->ingredient_id,
                'adjustment',
                -abs($stockTransfer->quantity),
                "Transfer ke outlet #{$stockTransfer->to_outlet_id}"
            );

            // Add to destination
            $destIngredient = Ingredient::where('outlet_id', $stockTransfer->to_outlet_id)
                ->where('ingredient_id', $stockTransfer->ingredient_id)
                ->orWhere(function ($q) use ($stockTransfer) {
                    $q->where('outlet_id', $stockTransfer->to_outlet_id)
                      ->whereRaw('id = ?', [$stockTransfer->ingredient_id]);
                })
                ->first();

            if ($destIngredient) {
                $this->inventoryService->recordMovement(
                    $stockTransfer->to_outlet_id,
                    $destIngredient->id,
                    'purchase',
                    $stockTransfer->quantity,
                    "Transfer dari outlet #{$stockTransfer->from_outlet_id}"
                );
            }

            $stockTransfer->update([
                'status'       => 'completed',
                'approved_by'  => $request->user()->id,
                'completed_at' => now(),
            ]);
        });

        return ApiResponse::success(null, 'Transfer disetujui dan stok diupdate');
    }

    public function reject(Request $request, StockTransfer $stockTransfer)
    {
        if ($stockTransfer->status !== 'pending') {
            return ApiResponse::error('Transfer sudah diproses', 422);
        }

        $stockTransfer->update(['status' => 'rejected', 'approved_by' => $request->user()->id]);

        return ApiResponse::success(null, 'Transfer ditolak');
    }
}
