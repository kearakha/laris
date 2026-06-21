<?php

namespace App\Http\Requests\SuperAdmin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateTenantRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $tenantId = $this->route('id');

        return [
            'name'                 => ['required', 'string', 'max:100'],
            'slug'                 => ['required', 'string', 'max:50', 'regex:/^[a-z0-9\-]+$/', Rule::unique('tenants', 'slug')->ignore($tenantId)->whereNull('deleted_at')],
            'email'                => ['required', 'email', Rule::unique('tenants', 'email')->ignore($tenantId)->whereNull('deleted_at')],
            'phone'                => ['nullable', 'string', 'max:20'],
            'logo'                 => ['nullable', 'image', 'max:2048'],
            'primary_color'        => ['nullable', 'string', 'regex:/^#[0-9A-Fa-f]{6}$/'],
            'subscription_plan_id' => ['nullable', 'exists:subscription_plans,id'],
            'subscription_status'  => ['nullable', 'in:active,trial,cancelled,expired'],
            'trial_ends_at'        => ['nullable', 'date'],
        ];
    }
}
