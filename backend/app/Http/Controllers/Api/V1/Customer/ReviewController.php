<?php

namespace App\Http\Controllers\Api\V1\Customer;

use App\Http\Controllers\Controller;
use App\Helpers\ApiResponse;
use App\Models\Order;
use App\Models\Review;
use Illuminate\Http\Request;

class ReviewController extends Controller
{
    public function store(Request $request)
    {
        $data = $request->validate([
            'order_id'        => 'required|exists:orders,id',
            'overall_rating'  => 'required|integer|min:1|max:5',
            'food_rating'     => 'nullable|integer|min:1|max:5',
            'service_rating'  => 'nullable|integer|min:1|max:5',
            'ambiance_rating' => 'nullable|integer|min:1|max:5',
            'comment'         => 'nullable|string|max:2000',
            'item_ratings'    => 'nullable|array',
            'item_ratings.*.menu_item_id' => 'exists:menu_items,id',
            'item_ratings.*.rating'       => 'integer|min:1|max:5',
        ]);

        $tenant = app('tenant');
        $customer = $request->user();

        // Verify order belongs to this customer and tenant
        $order = Order::withoutGlobalScopes()
            ->where('id', $data['order_id'])
            ->where('tenant_id', $tenant->id)
            ->where('customer_id', $customer->id)
            ->firstOrFail();

        // Prevent duplicate review per order
        if (Review::where('order_id', $order->id)->exists()) {
            return ApiResponse::error('Order ini sudah diulas', 422);
        }

        $review = Review::create([
            'tenant_id'       => $tenant->id,
            'outlet_id'       => $order->outlet_id,
            'order_id'        => $order->id,
            'customer_id'     => $customer->id,
            'overall_rating'  => $data['overall_rating'],
            'food_rating'     => $data['food_rating'] ?? null,
            'service_rating'  => $data['service_rating'] ?? null,
            'ambiance_rating' => $data['ambiance_rating'] ?? null,
            'reviewer_name'   => $customer->name,
            'comment'         => $data['comment'] ?? null,
        ]);

        if (!empty($data['item_ratings'])) {
            foreach ($data['item_ratings'] as $ir) {
                $review->menuItemReviews()->create([
                    'menu_item_id' => $ir['menu_item_id'],
                    'rating'       => $ir['rating'],
                ]);
            }
        }

        return ApiResponse::success($review, 'Ulasan dikirim', 201);
    }

    public function myReviews(Request $request)
    {
        $reviews = Review::where('customer_id', $request->user()->id)
            ->with('outlet:id,name', 'menuItemReviews.menuItem:id,name')
            ->latest()
            ->paginate(15);

        return ApiResponse::success($reviews);
    }
}
