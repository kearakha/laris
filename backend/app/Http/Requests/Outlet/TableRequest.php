<?php

namespace App\Http\Requests\Outlet;

use Illuminate\Foundation\Http\FormRequest;

class TableRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => 'required|string|max:50',
            'capacity' => 'nullable|integer|min:1|max:100',
        ];
    }
}
