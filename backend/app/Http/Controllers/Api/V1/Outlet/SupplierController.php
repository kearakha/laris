<?php

namespace App\Http\Controllers\Api\V1\Outlet;

use App\Helpers\ApiResponse;
use App\Http\Controllers\Controller;
use App\Models\Supplier;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SupplierController extends Controller
{
    public function index(): JsonResponse
    {
        $suppliers = Supplier::where('is_active', true)->orderBy('name')->get();
        return ApiResponse::success($suppliers, 'Supplier list');
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name'         => 'required|string|max:100',
            'contact_name' => 'nullable|string|max:100',
            'phone'        => 'nullable|string|max:30',
            'email'        => 'nullable|email|max:100',
            'address'      => 'nullable|string',
        ]);

        $supplier = Supplier::create($validated);
        return ApiResponse::success($supplier, 'Supplier dibuat', 201);
    }

    public function update(Request $request, Supplier $supplier): JsonResponse
    {
        $validated = $request->validate([
            'name'         => 'sometimes|string|max:100',
            'contact_name' => 'nullable|string|max:100',
            'phone'        => 'nullable|string|max:30',
            'email'        => 'nullable|email|max:100',
            'address'      => 'nullable|string',
            'is_active'    => 'boolean',
        ]);

        $supplier->update($validated);
        return ApiResponse::success($supplier, 'Supplier diupdate');
    }

    public function destroy(Supplier $supplier): JsonResponse
    {
        $supplier->delete();
        return ApiResponse::success(null, 'Supplier dihapus');
    }
}
