<?php

namespace App\Http\Requests\SuperAdmin;

use Illuminate\Foundation\Http\FormRequest;

class StoreSubscriptionPlanRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name'           => ['required', 'string', 'max:50'],
            'price_monthly'  => ['required', 'numeric', 'min:0'],
            'price_yearly'   => ['required', 'numeric', 'min:0'],
            'max_outlets'    => ['required', 'integer', 'min:1'],
            'max_users'      => ['required', 'integer', 'min:1'],
            'features'       => ['nullable', 'array'],
            'features.*'     => ['string'],
            'is_active'      => ['boolean'],
        ];
    }
}
