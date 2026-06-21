<?php

namespace App\Http\Requests\Outlet;

use Illuminate\Foundation\Http\FormRequest;

class CreateOrderRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'table_id' => 'nullable|exists:tables,id',
            'customer_id' => 'nullable|integer',
            'customer_name' => 'nullable|string|max:100',
            'type' => 'nullable|in:dine_in,takeaway,delivery',
            'notes' => 'nullable|string|max:500',
            'items' => 'required|array|min:1',
            'items.*.menu_item_id' => 'required|exists:menu_items,id',
            'items.*.quantity' => 'required|integer|min:1',
            'items.*.notes' => 'nullable|string|max:255',
            'items.*.variant_options' => 'nullable|array',
            'items.*.variant_options.*' => 'integer|exists:menu_item_variant_options,id',
            'items.*.addons' => 'nullable|array',
            'items.*.addons.*' => 'integer|exists:menu_item_addons,id',
        ];
    }
}
