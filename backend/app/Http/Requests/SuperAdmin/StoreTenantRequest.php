<?php

namespace App\Http\Requests\SuperAdmin;

use Illuminate\Foundation\Http\FormRequest;

class StoreTenantRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name'                   => ['required', 'string', 'max:100'],
            'slug'                   => ['required', 'string', 'max:50', 'unique:tenants,slug', 'regex:/^[a-z0-9\-]+$/'],
            'email'                  => ['required', 'email', 'unique:tenants,email'],
            'phone'                  => ['nullable', 'string', 'max:20'],
            'logo'                   => ['nullable', 'image', 'max:2048'],
            'primary_color'          => ['nullable', 'string', 'regex:/^#[0-9A-Fa-f]{6}$/'],
            'subscription_plan_id'   => ['nullable', 'exists:subscription_plans,id'],
            'subscription_status'    => ['nullable', 'in:active,trial,cancelled,expired'],
            'trial_ends_at'          => ['nullable', 'date'],

            // Owner account
            'owner_name'             => ['required', 'string', 'max:100'],
            'owner_email'            => ['required', 'email', 'unique:users,email'],
            'owner_password'         => ['required', 'string', 'min:8'],
            'owner_phone'            => ['nullable', 'string', 'max:20'],
        ];
    }

    public function messages(): array
    {
        return [
            'slug.regex' => 'Slug hanya boleh berisi huruf kecil, angka, dan tanda hubung.',
        ];
    }
}
