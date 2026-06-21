<?php

namespace App\Http\Controllers\Api\V1;

use App\Helpers\ApiResponse;
use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Http\Requests\Auth\UpdateProfileRequest;
use App\Services\AuthService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AuthController extends Controller
{
    public function __construct(private readonly AuthService $authService) {}

    public function login(LoginRequest $request): JsonResponse
    {
        $result = $this->authService->login(
            $request->email,
            $request->password,
            $request->device_name ?? $request->userAgent() ?? 'api'
        );

        return ApiResponse::success($result, 'Login berhasil.');
    }

    public function logout(Request $request): JsonResponse
    {
        $this->authService->logout($request->user());

        return ApiResponse::success(null, 'Logout berhasil.');
    }

    public function profile(Request $request): JsonResponse
    {
        return ApiResponse::success(
            $this->authService->formatUser($request->user()),
            'Data profil berhasil diambil.'
        );
    }

    public function updateProfile(UpdateProfileRequest $request): JsonResponse
    {
        $user = $request->user();
        $data = $request->validated();

        if ($request->hasFile('avatar')) {
            $data['avatar'] = $request->file('avatar')->store('avatars', 'public');
        }

        $user->update($data);

        return ApiResponse::success(
            $this->authService->formatUser($user->fresh()),
            'Profil berhasil diperbarui.'
        );
    }
}
