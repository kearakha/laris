<?php

use App\Http\Controllers\Api\V1\SuperAdmin\SubscriptionPlanController;
use App\Http\Controllers\Api\V1\SuperAdmin\TenantController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1/super-admin')
    ->middleware(['auth:sanctum', 'role:super_admin'])
    ->group(function () {
        // Tenant management
        Route::get('/tenants', [TenantController::class, 'index']);
        Route::post('/tenants', [TenantController::class, 'store']);
        Route::get('/tenants/{id}', [TenantController::class, 'show']);
        Route::put('/tenants/{id}', [TenantController::class, 'update']);
        Route::delete('/tenants/{id}', [TenantController::class, 'destroy']);
        Route::post('/tenants/{id}/restore', [TenantController::class, 'restore']);

        // Subscription plan management
        Route::get('/subscription-plans', [SubscriptionPlanController::class, 'index']);
        Route::post('/subscription-plans', [SubscriptionPlanController::class, 'store']);
        Route::get('/subscription-plans/{id}', [SubscriptionPlanController::class, 'show']);
        Route::put('/subscription-plans/{id}', [SubscriptionPlanController::class, 'update']);
        Route::delete('/subscription-plans/{id}', [SubscriptionPlanController::class, 'destroy']);
    });
