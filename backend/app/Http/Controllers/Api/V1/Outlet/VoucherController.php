<?php

namespace App\Http\Controllers\Api\V1\Outlet;

use App\Helpers\ApiResponse;
use App\Http\Controllers\Controller;
use App\Models\Voucher;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class VoucherController extends Controller
{
    /**
     * GET /outlet/vouchers
     */
    public function index(): JsonResponse
    {
        $vouchers = Voucher::latest()->paginate(20);
        return ApiResponse::success($vouchers, 'Voucher list');
    }

    /**
     * POST /outlet/vouchers
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'code'               => 'required|string|max:50|unique:vouchers,code',
            'name'               => 'required|string|max:100',
            'type'               => 'required|in:percentage,fixed,free_item',
            'value'              => 'required|numeric|min:0',
            'min_order_amount'   => 'nullable|numeric|min:0',
            'max_discount_amount'=> 'nullable|numeric|min:0',
            'max_uses'           => 'nullable|integer|min:1',
            'is_active'          => 'boolean',
            'valid_from'         => 'nullable|date',
            'valid_until'        => 'nullable|date|after_or_equal:valid_from',
        ]);

        $validated['code'] = strtoupper($validated['code']);
        $voucher = Voucher::create($validated);

        return ApiResponse::success($voucher, 'Voucher dibuat', 201);
    }

    /**
     * PUT /outlet/vouchers/{voucher}
     */
    public function update(Request $request, Voucher $voucher): JsonResponse
    {
        $validated = $request->validate([
            'name'               => 'sometimes|string|max:100',
            'type'               => 'sometimes|in:percentage,fixed,free_item',
            'value'              => 'sometimes|numeric|min:0',
            'min_order_amount'   => 'nullable|numeric|min:0',
            'max_discount_amount'=> 'nullable|numeric|min:0',
            'max_uses'           => 'nullable|integer|min:1',
            'is_active'          => 'boolean',
            'valid_from'         => 'nullable|date',
            'valid_until'        => 'nullable|date',
        ]);

        $voucher->update($validated);

        return ApiResponse::success($voucher, 'Voucher diupdate');
    }

    /**
     * DELETE /outlet/vouchers/{voucher}
     */
    public function destroy(Voucher $voucher): JsonResponse
    {
        $voucher->delete();
        return ApiResponse::success(null, 'Voucher dihapus');
    }
}
