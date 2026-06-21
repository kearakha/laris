<?php

use App\Http\Controllers\Api\V1\Customer\AuthController;
use App\Http\Controllers\Api\V1\Customer\LoyaltyController;
use App\Http\Controllers\Api\V1\Customer\ReservationController;
use App\Http\Controllers\Api\V1\Customer\ReviewController;
use App\Http\Controllers\Api\V1\Customer\FeedbackController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1/customer')
    ->middleware(['tenant', 'subscription.active'])
    ->group(function () {
        // Public auth — no customer guard
        Route::post('register', [AuthController::class, 'register']);
        Route::post('login', [AuthController::class, 'login']);

        // Authenticated customer routes
        Route::middleware('auth:customer')->group(function () {
            Route::get('profile', [AuthController::class, 'profile']);
            Route::put('profile', [AuthController::class, 'updateProfile']);
            Route::post('logout', [AuthController::class, 'logout']);

            // Loyalty
            Route::get('loyalty/balance', [LoyaltyController::class, 'balance']);
            Route::get('loyalty/history', [LoyaltyController::class, 'history']);

            // Reservations
            Route::get('reservations', [ReservationController::class, 'index']);
            Route::post('reservations', [ReservationController::class, 'store']);
            Route::get('reservations/{reservation}', [ReservationController::class, 'show']);
            Route::post('reservations/{reservation}/cancel', [ReservationController::class, 'cancel']);

            // Reviews
            Route::get('reviews', [ReviewController::class, 'myReviews']);
            Route::post('reviews', [ReviewController::class, 'store']);

            // Feedback / Complaints
            Route::post('feedback', [FeedbackController::class, 'store']);
        });
    });
