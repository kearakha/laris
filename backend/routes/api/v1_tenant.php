<?php

use Illuminate\Support\Facades\Route;

// Fase 2+ — tenant-level routes (outlets, users, reports)
Route::prefix('v1/tenant')
    ->middleware(['auth:sanctum', 'tenant', 'subscription.active'])
    ->group(function () {
        // Coming in Fase 2
    });
