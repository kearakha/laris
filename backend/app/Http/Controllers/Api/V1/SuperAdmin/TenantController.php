<?php

namespace App\Http\Controllers\Api\V1\SuperAdmin;

use App\Helpers\ApiResponse;
use App\Http\Controllers\Controller;
use App\Http\Requests\SuperAdmin\StoreTenantRequest;
use App\Http\Requests\SuperAdmin\UpdateTenantRequest;
use App\Repositories\TenantRepository;
use App\Services\TenantService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TenantController extends Controller
{
    public function __construct(
        private readonly TenantRepository $repository,
        private readonly TenantService $service
    ) {}

    public function index(Request $request): JsonResponse
    {
        $tenants = $this->repository->paginate(
            filters: $request->only(['search', 'status', 'trashed']),
            perPage: $request->integer('per_page', 15)
        );

        return ApiResponse::paginated($tenants, 'Data tenant berhasil diambil.');
    }

    public function store(StoreTenantRequest $request): JsonResponse
    {
        $tenant = $this->service->create($request->validated());

        return ApiResponse::success($tenant, 'Tenant berhasil dibuat.', 201);
    }

    public function show(int $id): JsonResponse
    {
        $tenant = $this->repository->findById($id, withTrashed: true);

        if (!$tenant) {
            return ApiResponse::error('Tenant tidak ditemukan.', 404);
        }

        return ApiResponse::success($tenant, 'Data tenant berhasil diambil.');
    }

    public function update(UpdateTenantRequest $request, int $id): JsonResponse
    {
        $tenant = $this->repository->findById($id);

        if (!$tenant) {
            return ApiResponse::error('Tenant tidak ditemukan.', 404);
        }

        $tenant = $this->service->update($tenant, $request->validated());

        return ApiResponse::success($tenant, 'Tenant berhasil diperbarui.');
    }

    public function destroy(int $id): JsonResponse
    {
        $tenant = $this->repository->findById($id);

        if (!$tenant) {
            return ApiResponse::error('Tenant tidak ditemukan.', 404);
        }

        $tenant->delete();

        return ApiResponse::success(null, 'Tenant berhasil dihapus.');
    }

    public function restore(int $id): JsonResponse
    {
        $tenant = $this->repository->findById($id, withTrashed: true);

        if (!$tenant) {
            return ApiResponse::error('Tenant tidak ditemukan.', 404);
        }

        $tenant->restore();

        return ApiResponse::success($tenant->fresh(), 'Tenant berhasil dipulihkan.');
    }
}
