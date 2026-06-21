<?php

namespace App\Http\Controllers\Api\V1\Outlet;

use App\Helpers\ApiResponse;
use App\Http\Controllers\Controller;
use App\Models\Ingredient;
use App\Models\StockMovement;
use App\Services\InventoryService;
use App\Enums\StockMovementType;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class IngredientController extends Controller
{
    public function __construct(private InventoryService $inventoryService) {}

    /**
     * GET /outlet/inventory/ingredients
     */
    public function index(Request $request): JsonResponse
    {
        $query = Ingredient::query();

        if ($request->boolean('low_stock')) {
            $query->whereColumn('current_stock', '<=', 'min_stock');
        }

        if ($request->filled('search')) {
            $query->where('name', 'like', '%' . $request->search . '%');
        }

        $ingredients = $query->orderBy('name')->paginate(30);

        return ApiResponse::success($ingredients, 'Ingredient list');
    }

    /**
     * POST /outlet/inventory/ingredients
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name'          => 'required|string|max:100',
            'unit'          => 'required|in:kg,liter,pcs,gram,ml,box',
            'current_stock' => 'nullable|numeric|min:0',
            'min_stock'     => 'nullable|numeric|min:0',
            'cost_per_unit' => 'nullable|numeric|min:0',
        ]);

        $ingredient = Ingredient::create($validated);

        return ApiResponse::success($ingredient, 'Bahan baku dibuat', 201);
    }

    /**
     * PUT /outlet/inventory/ingredients/{ingredient}
     */
    public function update(Request $request, Ingredient $ingredient): JsonResponse
    {
        $validated = $request->validate([
            'name'          => 'sometimes|string|max:100',
            'unit'          => 'sometimes|in:kg,liter,pcs,gram,ml,box',
            'min_stock'     => 'nullable|numeric|min:0',
            'cost_per_unit' => 'nullable|numeric|min:0',
        ]);

        $ingredient->update($validated);

        return ApiResponse::success($ingredient, 'Bahan baku diupdate');
    }

    /**
     * DELETE /outlet/inventory/ingredients/{ingredient}
     */
    public function destroy(Ingredient $ingredient): JsonResponse
    {
        $ingredient->delete();
        return ApiResponse::success(null, 'Bahan baku dihapus');
    }

    /**
     * POST /outlet/inventory/ingredients/{ingredient}/adjustment
     * Manual stock adjustment
     */
    public function adjustment(Request $request, Ingredient $ingredient): JsonResponse
    {
        $validated = $request->validate([
            'type'     => 'required|in:adjustment,waste',
            'quantity' => 'required|numeric',
            'notes'    => 'nullable|string',
        ]);

        $outletId = $request->header('X-Outlet-Id', app('tenant')->outlets()->value('id'));

        $movement = $this->inventoryService->recordMovement(
            outletId: (int) $outletId,
            tenantId: app('tenant')->id,
            ingredientId: $ingredient->id,
            type: StockMovementType::from($validated['type']),
            quantity: (float) $validated['quantity'],
            notes: $validated['notes'] ?? null,
            createdBy: auth()->id(),
        );

        return ApiResponse::success([
            'movement'   => $movement,
            'ingredient' => $ingredient->fresh(),
        ], 'Stok disesuaikan');
    }

    /**
     * GET /outlet/inventory/ingredients/{ingredient}/movements
     */
    public function movements(Ingredient $ingredient): JsonResponse
    {
        $movements = StockMovement::where('ingredient_id', $ingredient->id)
            ->with('createdBy:id,name')
            ->latest()
            ->paginate(30);

        return ApiResponse::success($movements, 'Stock movements');
    }

    /**
     * GET /outlet/inventory/waste-report
     */
    public function wasteReport(Request $request): JsonResponse
    {
        $outletId = $request->header('X-Outlet-Id', app('tenant')->outlets()->value('id'));
        $from = $request->input('date_from', now()->startOfMonth()->toDateString());
        $to   = $request->input('date_to', now()->toDateString());

        $movements = StockMovement::with('ingredient:id,name,unit,cost_per_unit')
            ->where('outlet_id', $outletId)
            ->where('type', StockMovementType::Waste)
            ->whereBetween('created_at', [$from . ' 00:00:00', $to . ' 23:59:59'])
            ->latest()
            ->get();

        $byIngredient = $movements->groupBy('ingredient_id')->map(function ($rows) {
            $first = $rows->first();
            $totalQty = $rows->sum('quantity');
            $costPerUnit = (float) ($first->ingredient->cost_per_unit ?? 0);
            return [
                'ingredient_id'   => $first->ingredient_id,
                'ingredient_name' => $first->ingredient->name ?? '-',
                'unit'            => $first->ingredient->unit ?? '',
                'total_quantity'  => abs($totalQty),
                'total_cost'      => round(abs($totalQty) * $costPerUnit),
                'entries'         => $rows->count(),
            ];
        })->values();

        $summary = [
            'total_waste_cost' => $byIngredient->sum('total_cost'),
            'total_entries'    => $movements->count(),
        ];

        return ApiResponse::success([
            'by_ingredient' => $byIngredient,
            'entries'       => $movements,
            'summary'       => $summary,
        ], 'Waste report');
    }
}
