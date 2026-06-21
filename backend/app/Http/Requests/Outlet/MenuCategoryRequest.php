<?php

namespace App\Http\Requests\Outlet;

use Illuminate\Foundation\Http\FormRequest;

class MenuCategoryRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => 'required|string|max:100',
            'image' => 'nullable|string|url',
            'sort_order' => 'nullable|integer|min:0',
            'is_active' => 'nullable|boolean',
        ];
    }
}
