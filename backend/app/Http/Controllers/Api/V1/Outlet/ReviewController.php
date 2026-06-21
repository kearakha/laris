<?php

namespace App\Http\Controllers\Api\V1\Outlet;

use App\Http\Controllers\Controller;
use App\Helpers\ApiResponse;
use App\Models\Review;
use Illuminate\Http\Request;

class ReviewController extends Controller
{
    public function index(Request $request)
    {
        $outletId = $request->header('X-Outlet-Id', app('tenant')->outlets()->value('id'));

        $reviews = Review::where('outlet_id', $outletId)
            ->where('is_published', true)
            ->with('customer:id,name', 'menuItemReviews.menuItem:id,name')
            ->latest()
            ->paginate(20);

        $avg = Review::where('outlet_id', $outletId)
            ->where('is_published', true)
            ->selectRaw('AVG(overall_rating) as avg_rating, COUNT(*) as total')
            ->first();

        return ApiResponse::success([
            'reviews'    => $reviews,
            'avg_rating' => round($avg->avg_rating ?? 0, 1),
            'total'      => $avg->total ?? 0,
        ]);
    }

    public function reply(Request $request, Review $review)
    {
        $data = $request->validate([
            'reply' => 'required|string|max:1000',
        ]);

        $review->update([
            'reply'      => $data['reply'],
            'replied_at' => now(),
        ]);

        return ApiResponse::success($review, 'Balasan dikirim');
    }

    public function complaints(Request $request)
    {
        $outletId = $request->header('X-Outlet-Id', app('tenant')->outlets()->value('id'));

        $complaints = \App\Models\FeedbackComplaint::where('outlet_id', $outletId)
            ->with('customer:id,name')
            ->when($request->filled('status'), fn ($q) => $q->where('status', $request->status))
            ->latest()
            ->paginate(20);

        return ApiResponse::success($complaints);
    }

    public function resolveComplaint(Request $request, \App\Models\FeedbackComplaint $complaint)
    {
        $data = $request->validate([
            'resolution_notes' => 'required|string|max:1000',
        ]);

        $complaint->update([
            'status'            => 'resolved',
            'resolution_notes'  => $data['resolution_notes'],
            'resolved_at'       => now(),
        ]);

        return ApiResponse::success($complaint, 'Complaint diselesaikan');
    }
}
