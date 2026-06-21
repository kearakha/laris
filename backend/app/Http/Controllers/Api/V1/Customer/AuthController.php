<?php

namespace App\Http\Controllers\Api\V1\Customer;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use App\Helpers\ApiResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function register(Request $request)
    {
        $data = $request->validate([
            'name'     => 'required|string|max:255',
            'email'    => 'nullable|email|max:255',
            'phone'    => 'nullable|string|max:20',
            'password' => 'required|string|min:6',
        ]);

        if (empty($data['email']) && empty($data['phone'])) {
            throw ValidationException::withMessages([
                'email' => 'Email atau nomor telepon wajib diisi',
            ]);
        }

        $tenant = app('tenant');

        // Check uniqueness within tenant
        if (!empty($data['email']) && Customer::where('tenant_id', $tenant->id)->where('email', $data['email'])->exists()) {
            throw ValidationException::withMessages(['email' => 'Email sudah terdaftar']);
        }

        if (!empty($data['phone']) && Customer::where('tenant_id', $tenant->id)->where('phone', $data['phone'])->exists()) {
            throw ValidationException::withMessages(['phone' => 'Nomor telepon sudah terdaftar']);
        }

        $customer = Customer::create([
            'tenant_id' => $tenant->id,
            'name'      => $data['name'],
            'email'     => $data['email'] ?? null,
            'phone'     => $data['phone'] ?? null,
            'password'  => Hash::make($data['password']),
        ]);

        $token = $customer->createToken('customer-token')->plainTextToken;

        return ApiResponse::success([
            'customer' => $customer,
            'token'    => $token,
        ], 'Registrasi berhasil', 201);
    }

    public function login(Request $request)
    {
        $data = $request->validate([
            'login'    => 'required|string', // email or phone
            'password' => 'required|string',
        ]);

        $tenant = app('tenant');

        $customer = Customer::where('tenant_id', $tenant->id)
            ->where(function ($q) use ($data) {
                $q->where('email', $data['login'])
                  ->orWhere('phone', $data['login']);
            })
            ->first();

        if (! $customer || ! Hash::check($data['password'], $customer->password)) {
            throw ValidationException::withMessages([
                'login' => 'Email/telepon atau password salah',
            ]);
        }

        $token = $customer->createToken('customer-token')->plainTextToken;

        return ApiResponse::success([
            'customer' => $customer,
            'token'    => $token,
        ], 'Login berhasil');
    }

    public function profile(Request $request)
    {
        return ApiResponse::success($request->user());
    }

    public function updateProfile(Request $request)
    {
        $data = $request->validate([
            'name'          => 'sometimes|string|max:255',
            'phone'         => 'sometimes|nullable|string|max:20',
            'date_of_birth' => 'sometimes|nullable|date',
            'gender'        => 'sometimes|nullable|in:male,female,other',
        ]);

        $request->user()->update($data);

        return ApiResponse::success($request->user()->fresh(), 'Profil diupdate');
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return ApiResponse::success(null, 'Logout berhasil');
    }
}
