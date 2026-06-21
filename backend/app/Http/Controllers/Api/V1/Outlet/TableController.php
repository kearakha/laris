<?php

namespace App\Http\Controllers\Api\V1\Outlet;

use App\Helpers\ApiResponse;
use App\Http\Controllers\Controller;
use App\Http\Requests\Outlet\TableRequest;
use App\Models\DiningTable;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class TableController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $outletId = $request->header('X-Outlet-Id');

        $tables = DiningTable::query()
            ->when($outletId, fn ($q, $v) => $q->where('outlet_id', $v))
            ->withCount(['orders' => fn ($q) => $q->whereIn('status', ['pending', 'confirmed', 'preparing', 'ready', 'served'])])
            ->orderBy('name')
            ->get();

        return ApiResponse::success($tables, 'Meja berhasil diambil');
    }

    public function store(TableRequest $request): JsonResponse
    {
        $outletId = $request->header('X-Outlet-Id');

        $table = DiningTable::create([
            'outlet_id' => $outletId,
            'qr_code' => Str::uuid()->toString(),
            ...$request->validated(),
        ]);

        return ApiResponse::success($table, 'Meja berhasil dibuat', 201);
    }

    public function update(TableRequest $request, DiningTable $table): JsonResponse
    {
        $table->update($request->validated());

        return ApiResponse::success($table, 'Meja berhasil diperbarui');
    }

    public function destroy(DiningTable $table): JsonResponse
    {
        $table->delete();

        return ApiResponse::success(null, 'Meja berhasil dihapus');
    }

    public function qrImage(string $qrToken): JsonResponse
    {
        $table = DiningTable::where('qr_code', $qrToken)->firstOrFail();

        $qrUrl = url("/order/{$qrToken}");

        return ApiResponse::success([
            'qr_token' => $qrToken,
            'qr_url' => $qrUrl,
            'table' => $table->name,
        ], 'QR data berhasil diambil');
    }
}
