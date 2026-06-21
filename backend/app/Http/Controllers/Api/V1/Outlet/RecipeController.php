<?php

namespace App\Http\Controllers\Api\V1\Outlet;

use App\Http\Controllers\Controller;
use App\Helpers\ApiResponse;
use App\Models\MenuItem;
use App\Models\MenuItemIngredient;
use Illuminate\Http\Request;

class RecipeController extends Controller
{
    public function show(Request $request, MenuItem $menuItem)
    {
        $recipe = $menuItem->load('menuItemIngredients.ingredient');
        $hpp    = $menuItem->calculateHpp();
        $margin = (float) $menuItem->base_price > 0
            ? round((1 - $hpp / (float) $menuItem->base_price) * 100, 1)
            : 0;

        return ApiResponse::success([
            'menu_item'  => $menuItem,
            'recipe'     => $recipe->menuItemIngredients,
            'hpp'        => $hpp,
            'sell_price' => (float) $menuItem->base_price,
            'margin'     => $margin,
        ]);
    }

    public function update(Request $request, MenuItem $menuItem)
    {
        $data = $request->validate([
            'ingredients'                     => 'required|array',
            'ingredients.*.ingredient_id'     => 'required|exists:ingredients,id',
            'ingredients.*.quantity_used'     => 'required|numeric|min:0.001',
        ]);

        // Replace all recipe entries
        $menuItem->menuItemIngredients()->delete();

        foreach ($data['ingredients'] as $row) {
            MenuItemIngredient::create([
                'menu_item_id'  => $menuItem->id,
                'ingredient_id' => $row['ingredient_id'],
                'quantity_used' => $row['quantity_used'],
            ]);
        }

        $hpp = $menuItem->fresh()->calculateHpp();

        return ApiResponse::success([
            'recipe' => $menuItem->fresh()->menuItemIngredients()->with('ingredient')->get(),
            'hpp'    => $hpp,
        ], 'Resep disimpan');
    }

    public function costingReport(Request $request)
    {
        $outletId = (int) ($request->header('X-Outlet-Id') ?? app('tenant')->outlets()->value('id'));

        $items = MenuItem::where('outlet_id', $outletId)
            ->orWhereNull('outlet_id')
            ->with('menuItemIngredients.ingredient')
            ->where('is_available', true)
            ->get()
            ->map(function ($item) {
                $hpp = $item->calculateHpp();
                $price = (float) $item->base_price;
                return [
                    'id'         => $item->id,
                    'name'       => $item->name,
                    'sell_price' => $price,
                    'hpp'        => $hpp,
                    'margin'     => $price > 0 ? round((1 - $hpp / $price) * 100, 1) : null,
                    'profit'     => $price - $hpp,
                ];
            })
            ->sortBy('margin')
            ->values();

        return ApiResponse::success($items);
    }
}
