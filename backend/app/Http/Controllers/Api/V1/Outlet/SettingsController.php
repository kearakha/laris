<?php

namespace App\Http\Controllers\Api\V1\Outlet;

use App\Helpers\ApiResponse;
use App\Http\Controllers\Controller;
use App\Models\OutletSetting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SettingsController extends Controller
{
    public function show(Request $request): JsonResponse
    {
        $outletId = (int) $request->header('X-Outlet-Id');
        $settings = OutletSetting::firstOrCreate(
            ['outlet_id' => $outletId],
            ['tenant_id' => app('tenant')->id]
        );

        return ApiResponse::success($settings, 'Outlet settings');
    }

    public function update(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'ppn_rate'                  => 'nullable|numeric|min:0|max:100',
            'ppn_inclusive'             => 'nullable|boolean',
            'service_charge_rate'       => 'nullable|numeric|min:0|max:100',
            'receipt_header'            => 'nullable|string|max:500',
            'receipt_footer'            => 'nullable|string|max:500',
            'auto_print_receipt'        => 'nullable|boolean',
            'kds_enabled'               => 'nullable|boolean',
            'loyalty_enabled'           => 'nullable|boolean',
            'reservation_enabled'       => 'nullable|boolean',
            'whatsapp_token'            => 'nullable|string',
            'whatsapp_sender'           => 'nullable|string',
            'wa_receipt_enabled'        => 'nullable|boolean',
            'wa_order_notify_enabled'   => 'nullable|boolean',
        ]);

        $outletId = (int) $request->header('X-Outlet-Id');
        $settings = OutletSetting::updateOrCreate(
            ['outlet_id' => $outletId],
            array_merge($validated, ['tenant_id' => app('tenant')->id])
        );

        return ApiResponse::success($settings, 'Pengaturan disimpan');
    }
}
