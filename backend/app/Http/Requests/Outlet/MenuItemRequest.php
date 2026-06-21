<?php

namespace App\Http\Requests\Outlet;

use Illuminate\Foundation\Http\FormRequest;

class MenuItemRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'category_id' => 'required|exists:menu_categories,id',
            'name' => 'required|string|max:150',
            'description' => 'nullable|string|max:500',
            'image' => 'nullable|string|url',
            'base_price' => 'required|numeric|min:0',
            'is_available' => 'nullable|boolean',
            'is_featured' => 'nullable|boolean',
            'preparation_time' => 'nullable|integer|min:0',
            'sort_order' => 'nullable|integer|min:0',
            'variants' => 'nullable|array',
            'variants.*.name' => 'required|string|max:100',
            'variants.*.is_required' => 'nullable|boolean',
            'variants.*.options' => 'required|array|min:1',
            'variants.*.options.*.label' => 'required|string|max:100',
            'variants.*.options.*.price_modifier' => 'nullable|numeric',
            'variants.*.options.*.is_default' => 'nullable|boolean',
            'addons' => 'nullable|array',
            'addons.*.name' => 'required|string|max:100',
            'addons.*.price' => 'required|numeric|min:0',
            'addons.*.is_available' => 'nullable|boolean',
            'tags' => 'nullable|array',
            'tags.*' => 'string|in:spicy,vegetarian,bestseller,new,halal',
        ];
    }
}
