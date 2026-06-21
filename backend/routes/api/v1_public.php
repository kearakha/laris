<?php

use App\Http\Controllers\Api\V1\Public\MidtransWebhookController;
use App\Http\Controllers\Api\V1\Public\MarketplaceWebhookController;
use App\Http\Controllers\Api\V1\Public\QrOrderController;
use App\Http\Controllers\Api\V1\Public\ReviewController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1/public')
    ->middleware(['tenant'])
    ->group(function () {
        Route::get('menu/{outletSlug}', [QrOrderController::class, 'menu']);
        Route::get('tables/{qrToken}', [QrOrderController::class, 'tableInfo']);
        Route::post('tables/{qrToken}/orders', [QrOrderController::class, 'placeOrder']);
        Route::get('orders/{orderNumber}/status', [QrOrderController::class, 'orderStatus']);
        Route::post('orders/{orderNumber}/review', [ReviewController::class, 'store']);
    });

// Midtrans webhook — no tenant middleware, Midtrans posts here directly
Route::post('v1/webhooks/midtrans', [MidtransWebhookController::class, 'handle'])
    ->withoutMiddleware(['tenant']);

// Marketplace webhooks — platform posts here directly (no auth, no tenant middleware)
Route::post('v1/webhooks/marketplace/{platform}/{outletToken}', [MarketplaceWebhookController::class, 'handle'])
    ->withoutMiddleware(['tenant']);
