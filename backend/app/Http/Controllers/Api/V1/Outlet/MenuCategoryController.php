<?php

namespace App\Http\Controllers\Api\V1\Outlet;

use App\Helpers\ApiResponse;
use App\Http\Controllers\Controller;
use App\Http\Requests\Outlet\MenuCategoryRequest;
use App\Models\MenuCategory;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MenuCategoryController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $outletId = $request->header('X-Outlet-Id');

        $categories = MenuCategory::query()
            ->when($outletId, fn ($q) => $q->where(fn ($q) =>
                $q->where('outlet_id', $outletId)->orWhereNull('outlet_id')
            ))
            ->withCount('menuItems')
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get();

        return ApiResponse::success($categories, 'Kategori berhasil diambil');
    }

    public function store(MenuCategoryRequest $request): JsonResponse
    {
        $category = MenuCategory::create([
            'outlet_id' => $request->header('X-Outlet-Id') ?: null,
            ...$request->validated(),
        ]);

        return ApiResponse::success($category, 'Kategori berhasil dibuat', 201);
    }

    public function update(MenuCategoryRequest $request, MenuCategory $menuCategory): JsonResponse
    {
        $menuCategory->update($request->validated());

        return ApiResponse::success($menuCategory, 'Kategori berhasil diperbarui');
    }

    public function destroy(MenuCategory $menuCategory): JsonResponse
    {
        $menuCategory->delete();

        return ApiResponse::success(null, 'Kategori berhasil dihapus');
    }

    public function reorder(Request $request): JsonResponse
    {
        $request->validate([
            'items' => 'required|array',
            'items.*.id' => 'required|integer',
            'items.*.sort_order' => 'required|integer',
        ]);

        foreach ($request->items as $item) {
            MenuCategory::where('id', $item['id'])->update(['sort_order' => $item['sort_order']]);
        }

        return ApiResponse::success(null, 'Urutan kategori berhasil diperbarui');
    }
}
