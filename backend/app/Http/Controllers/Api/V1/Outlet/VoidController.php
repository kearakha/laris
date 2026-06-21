<?php

namespace App\Http\Controllers\Api\V1\Outlet;

use App\Http\Controllers\Controller;
use App\Helpers\ApiResponse;
use App\Models\Order;
use App\Services\VoidService;
use Illuminate\Http\Request;

class VoidController extends Controller
{
    public function __construct(private VoidService $voidService) {}

    public function void(Request $request, Order $order)
    {
        $data = $request->validate([
            'reason' => 'required|string|max:500',
        ]);

        $this->voidService->voidOrder($order, $request->user(), $data['reason']);

        return ApiResponse::success(null, 'Order di-void');
    }

    public function refund(Request $request, Order $order)
    {
        $data = $request->validate([
            'reason' => 'required|string|max:500',
        ]);

        $this->voidService->refundOrder($order, $request->user(), $data['reason']);

        return ApiResponse::success(null, 'Order di-refund');
    }
}
