<?php

namespace App\Http\Controllers\Api\V1\Outlet;

use App\Http\Controllers\Controller;
use App\Helpers\ApiResponse;
use App\Models\DiningTable;
use Illuminate\Http\Request;

class FloorPlanController extends Controller
{
    private function outletId(Request $request): int
    {
        return (int) ($request->header('X-Outlet-Id') ?? app('tenant')->outlets()->value('id'));
    }

    public function index(Request $request)
    {
        $floor = $request->get('floor', null);

        $tables = DiningTable::where('outlet_id', $this->outletId($request))
            ->when($floor, fn ($q) => $q->where('floor', $floor))
            ->get(['id', 'name', 'capacity', 'status', 'floor', 'pos_x', 'pos_y', 'shape', 'qr_code']);

        $floors = DiningTable::where('outlet_id', $this->outletId($request))
            ->distinct()
            ->pluck('floor')
            ->sort()
            ->values();

        return ApiResponse::success(['tables' => $tables, 'floors' => $floors]);
    }

    public function updatePositions(Request $request)
    {
        $data = $request->validate([
            'tables'          => 'required|array',
            'tables.*.id'     => 'required|exists:tables,id',
            'tables.*.pos_x'  => 'required|integer|min:0',
            'tables.*.pos_y'  => 'required|integer|min:0',
            'tables.*.floor'  => 'nullable|string|max:50',
            'tables.*.shape'  => 'nullable|in:square,round',
        ]);

        foreach ($data['tables'] as $row) {
            DiningTable::where('id', $row['id'])->update([
                'pos_x' => $row['pos_x'],
                'pos_y' => $row['pos_y'],
                'floor' => $row['floor'] ?? '1',
                'shape' => $row['shape'] ?? 'square',
            ]);
        }

        return ApiResponse::success(null, 'Posisi meja disimpan');
    }
}
