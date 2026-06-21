<?php

namespace App\Http\Controllers\Api\V1\Public;

use App\Http\Controllers\Controller;
use App\Helpers\ApiResponse;
use App\Models\Order;
use App\Models\Review;
use Illuminate\Http\Request;

class ReviewController extends Controller
{
    public function store(Request $request, string $orderNumber)
    {
        $data = $request->validate([
            'overall_rating'  => 'required|integer|min:1|max:5',
            'food_rating'     => 'nullable|integer|min:1|max:5',
            'service_rating'  => 'nullable|integer|min:1|max:5',
            'comment'         => 'nullable|string|max:2000',
            'reviewer_name'   => 'nullable|string|max:255',
        ]);

        $tenant = app('tenant');

        $order = Order::withoutGlobalScopes()
            ->where('order_number', $orderNumber)
            ->where('tenant_id', $tenant->id)
            ->firstOrFail();

        if (Review::where('order_id', $order->id)->exists()) {
            return ApiResponse::error('Order ini sudah diulas', 422);
        }

        $review = Review::create([
            'tenant_id'      => $tenant->id,
            'outlet_id'      => $order->outlet_id,
            'order_id'       => $order->id,
            'overall_rating' => $data['overall_rating'],
            'food_rating'    => $data['food_rating'] ?? null,
            'service_rating' => $data['service_rating'] ?? null,
            'reviewer_name'  => $data['reviewer_name'] ?? ($order->customer_name ?? 'Anonim'),
            'comment'        => $data['comment'] ?? null,
        ]);

        return ApiResponse::success($review, 'Terima kasih atas ulasanmu!', 201);
    }
}
