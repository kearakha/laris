<?php

namespace App\Http\Controllers\Api\V1\SuperAdmin;

use App\Helpers\ApiResponse;
use App\Http\Controllers\Controller;
use App\Http\Requests\SuperAdmin\StoreSubscriptionPlanRequest;
use App\Http\Requests\SuperAdmin\UpdateSubscriptionPlanRequest;
use App\Models\SubscriptionPlan;
use App\Services\SubscriptionPlanService;
use Illuminate\Http\JsonResponse;

class SubscriptionPlanController extends Controller
{
    public function __construct(private readonly SubscriptionPlanService $service) {}

    public function index(): JsonResponse
    {
        $plans = SubscriptionPlan::withTrashed()->withCount('tenants')->latest()->get();

        return ApiResponse::success($plans, 'Data subscription plan berhasil diambil.');
    }

    public function show(int $id): JsonResponse
    {
        $plan = SubscriptionPlan::withTrashed()->withCount('tenants')->find($id);

        if (!$plan) {
            return ApiResponse::error('Subscription plan tidak ditemukan.', 404);
        }

        return ApiResponse::success($plan, 'Data subscription plan berhasil diambil.');
    }

    public function store(StoreSubscriptionPlanRequest $request): JsonResponse
    {
        $plan = $this->service->create($request->validated());

        return ApiResponse::success($plan, 'Subscription plan berhasil dibuat.', 201);
    }

    public function update(UpdateSubscriptionPlanRequest $request, int $id): JsonResponse
    {
        $plan = SubscriptionPlan::find($id);

        if (!$plan) {
            return ApiResponse::error('Subscription plan tidak ditemukan.', 404);
        }

        $plan = $this->service->update($plan, $request->validated());

        return ApiResponse::success($plan, 'Subscription plan berhasil diperbarui.');
    }

    public function destroy(int $id): JsonResponse
    {
        $plan = SubscriptionPlan::find($id);

        if (!$plan) {
            return ApiResponse::error('Subscription plan tidak ditemukan.', 404);
        }

        try {
            $this->service->delete($plan);
        } catch (\RuntimeException $e) {
            return ApiResponse::error($e->getMessage(), 422);
        }

        return ApiResponse::success(null, 'Subscription plan berhasil dihapus.');
    }
}
