<?php

namespace App\Http\Controllers\Api\V1\Outlet;

use App\Http\Controllers\Controller;
use App\Helpers\ApiResponse;
use App\Models\CashDrawer;
use App\Services\CashDrawerService;
use Illuminate\Http\Request;

class CashDrawerController extends Controller
{
    public function __construct(private CashDrawerService $service) {}

    private function outletId(Request $request): int
    {
        return (int) ($request->header('X-Outlet-Id') ?? app('tenant')->outlets()->value('id'));
    }

    public function current(Request $request)
    {
        $shift = $this->service->getCurrentShift($this->outletId($request));
        return ApiResponse::success($shift);
    }

    public function history(Request $request)
    {
        $history = $this->service->getHistory($this->outletId($request));
        return ApiResponse::success($history);
    }

    public function open(Request $request)
    {
        $data = $request->validate([
            'opening_cash' => 'required|numeric|min:0',
            'notes'        => 'nullable|string|max:500',
        ]);

        $shift = $this->service->openShift(
            $this->outletId($request),
            $request->user()->id,
            $data['opening_cash'],
            $data['notes'] ?? null
        );

        return ApiResponse::success($shift, 'Shift dibuka', 201);
    }

    public function close(Request $request, CashDrawer $cashDrawer)
    {
        $data = $request->validate([
            'closing_cash' => 'required|numeric|min:0',
            'notes'        => 'nullable|string|max:500',
        ]);

        $shift = $this->service->closeShift(
            $cashDrawer,
            $request->user()->id,
            $data['closing_cash'],
            $data['notes'] ?? null
        );

        return ApiResponse::success($shift, 'Shift ditutup');
    }
}
