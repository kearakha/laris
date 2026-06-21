<?php

namespace App\Http\Controllers\Api\V1\Outlet;

use App\Helpers\ApiResponse;
use App\Http\Controllers\Controller;
use App\Http\Requests\Outlet\MenuItemRequest;
use App\Models\MenuItem;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class MenuItemController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $outletId = $request->header('X-Outlet-Id');

        $items = MenuItem::query()
            ->with(['category', 'variants.options', 'addons', 'tags'])
            ->when($outletId, fn ($q) => $q->where(fn ($q) =>
                $q->where('outlet_id', $outletId)->orWhereNull('outlet_id')
            ))
            ->when($request->category_id, fn ($q, $v) => $q->where('category_id', $v))
            ->when($request->has('available'), fn ($q) => $q->where('is_available', $request->boolean('available')))
            ->when($request->search, fn ($q, $v) => $q->where('name', 'like', "%{$v}%"))
            ->orderBy('sort_order')
            ->orderBy('name')
            ->paginate(50);

        return ApiResponse::paginated($items, 'Menu berhasil diambil');
    }

    public function store(MenuItemRequest $request): JsonResponse
    {
        $data = $request->validated();
        $data['outlet_id'] = $request->header('X-Outlet-Id') ?: null;
        $data['slug'] = Str::slug($data['name']) . '-' . Str::random(6);

        $item = MenuItem::create($data);

        if (!empty($data['variants'])) {
            foreach ($data['variants'] as $variantData) {
                $variant = $item->variants()->create([
                    'name' => $variantData['name'],
                    'is_required' => $variantData['is_required'] ?? false,
                ]);
                foreach ($variantData['options'] ?? [] as $i => $optionData) {
                    $variant->options()->create([
                        'label' => $optionData['label'],
                        'price_modifier' => $optionData['price_modifier'] ?? 0,
                        'is_default' => $optionData['is_default'] ?? false,
                        'sort_order' => $i,
                    ]);
                }
            }
        }

        if (!empty($data['addons'])) {
            foreach ($data['addons'] as $addonData) {
                $item->addons()->create($addonData);
            }
        }

        if (!empty($data['tags'])) {
            foreach ($data['tags'] as $tag) {
                $item->tags()->create(['tag' => $tag]);
            }
        }

        $item->load(['category', 'variants.options', 'addons', 'tags']);

        return ApiResponse::success($item, 'Menu berhasil dibuat', 201);
    }

    public function show(MenuItem $menuItem): JsonResponse
    {
        $menuItem->load(['category', 'variants.options', 'addons', 'tags']);

        return ApiResponse::success($menuItem, 'Detail menu berhasil diambil');
    }

    public function update(MenuItemRequest $request, MenuItem $menuItem): JsonResponse
    {
        $data = $request->validated();
        $menuItem->update($data);

        if (isset($data['variants'])) {
            $menuItem->variants()->delete();
            foreach ($data['variants'] as $variantData) {
                $variant = $menuItem->variants()->create([
                    'name' => $variantData['name'],
                    'is_required' => $variantData['is_required'] ?? false,
                ]);
                foreach ($variantData['options'] ?? [] as $i => $optionData) {
                    $variant->options()->create([
                        'label' => $optionData['label'],
                        'price_modifier' => $optionData['price_modifier'] ?? 0,
                        'is_default' => $optionData['is_default'] ?? false,
                        'sort_order' => $i,
                    ]);
                }
            }
        }

        if (isset($data['addons'])) {
            $menuItem->addons()->delete();
            foreach ($data['addons'] as $addonData) {
                $menuItem->addons()->create($addonData);
            }
        }

        if (isset($data['tags'])) {
            $menuItem->tags()->delete();
            foreach ($data['tags'] as $tag) {
                $menuItem->tags()->create(['tag' => $tag]);
            }
        }

        $menuItem->load(['category', 'variants.options', 'addons', 'tags']);

        return ApiResponse::success($menuItem, 'Menu berhasil diperbarui');
    }

    public function destroy(MenuItem $menuItem): JsonResponse
    {
        $menuItem->delete();

        return ApiResponse::success(null, 'Menu berhasil dihapus');
    }

    public function toggleAvailability(MenuItem $menuItem): JsonResponse
    {
        $menuItem->update(['is_available' => !$menuItem->is_available]);

        return ApiResponse::success(
            ['is_available' => $menuItem->is_available],
            'Ketersediaan menu berhasil diperbarui'
        );
    }
}
