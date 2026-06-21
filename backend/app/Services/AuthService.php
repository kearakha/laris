<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthService
{
    public function login(string $email, string $password, string $deviceName = 'api'): array
    {
        $user = User::with(['tenant', 'outlet'])->where('email', $email)->first();

        if (!$user || !Hash::check($password, $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['Email atau password salah.'],
            ]);
        }

        if (!$user->is_active) {
            throw ValidationException::withMessages([
                'email' => ['Akun Anda tidak aktif. Hubungi administrator.'],
            ]);
        }

        $user->update(['last_login_at' => now()]);

        $token = $user->createToken($deviceName)->plainTextToken;

        return [
            'token' => $token,
            'user'  => $this->formatUser($user),
        ];
    }

    public function logout(User $user): void
    {
        $user->currentAccessToken()->delete();
    }

    public function formatUser(User $user): array
    {
        $user->loadMissing(['tenant', 'outlet']);

        return [
            'id'             => $user->id,
            'name'           => $user->name,
            'email'          => $user->email,
            'phone'          => $user->phone,
            'avatar'         => $user->avatar,
            'is_active'      => $user->is_active,
            'last_login_at'  => $user->last_login_at,
            'roles'          => $user->getRoleNames(),
            'permissions'    => $user->getAllPermissions()->pluck('name'),
            'tenant'         => $user->tenant ? [
                'id'                  => $user->tenant->id,
                'name'                => $user->tenant->name,
                'slug'                => $user->tenant->slug,
                'logo'                => $user->tenant->logo,
                'primary_color'       => $user->tenant->primary_color,
                'subscription_status' => $user->tenant->subscription_status,
            ] : null,
            'outlet'         => $user->outlet ? [
                'id'   => $user->outlet->id,
                'name' => $user->outlet->name,
                'slug' => $user->outlet->slug,
            ] : null,
        ];
    }
}
