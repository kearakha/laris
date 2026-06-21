<?php

namespace App\Http\Controllers\Api\V1\Outlet;

use App\Http\Controllers\Controller;
use App\Helpers\ApiResponse;
use App\Services\AnalyticsService;
use Illuminate\Http\Request;

class AnalyticsController extends Controller
{
    public function __construct(private AnalyticsService $analyticsService) {}

    public function dashboard(Request $request)
    {
        $outletId = (int) ($request->header('X-Outlet-Id') ?? app('tenant')->outlets()->value('id'));

        $dateFrom = $request->get('date_from', today()->startOfMonth()->toDateString());
        $dateTo   = $request->get('date_to', today()->toDateString());

        $data = $this->analyticsService->getDashboard($outletId, $dateFrom, $dateTo);

        return ApiResponse::success($data);
    }
}
