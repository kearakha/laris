<?php

namespace App\Http\Controllers\Api\V1\Customer;

use App\Http\Controllers\Controller;
use App\Helpers\ApiResponse;
use App\Services\LoyaltyService;
use Illuminate\Http\Request;

class LoyaltyController extends Controller
{
    public function __construct(private LoyaltyService $loyaltyService) {}

    public function balance(Request $request)
    {
        return ApiResponse::success(
            $this->loyaltyService->getBalance($request->user())
        );
    }

    public function history(Request $request)
    {
        $history = $request->user()
            ->loyaltyTransactions()
            ->latest()
            ->paginate(20);

        return ApiResponse::success($history);
    }
}
