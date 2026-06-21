<?php

namespace App\Http\Controllers\Api\V1\Outlet;

use App\Helpers\ApiResponse;
use App\Http\Controllers\Controller;
use App\Jobs\SendEodReportJob;
use App\Models\OutletSetting;
use App\Services\AnalyticsService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ReportController extends Controller
{
    public function __construct(private AnalyticsService $analytics) {}

    /**
     * GET /outlet/reports/eod — preview today's EOD data
     */
    public function eodPreview(Request $request): JsonResponse
    {
        $outletId = (int) $request->header('X-Outlet-Id');
        $today    = now()->toDateString();

        $data = $this->analytics->getDashboard($outletId, $today, $today);

        return ApiResponse::success($data, 'EOD preview');
    }

    /**
     * POST /outlet/reports/eod/send — manual EOD send
     */
    public function sendEod(Request $request): JsonResponse
    {
        $outletId = (int) $request->header('X-Outlet-Id');

        SendEodReportJob::dispatch($outletId);

        return ApiResponse::success(null, 'EOD report dijadwalkan untuk dikirim');
    }

    /**
     * GET /outlet/reports/schedule
     */
    public function getSchedule(Request $request): JsonResponse
    {
        $outletId = (int) $request->header('X-Outlet-Id');
        $setting  = OutletSetting::where('outlet_id', $outletId)->first();

        return ApiResponse::success([
            'eod_enabled'           => $setting?->eod_report_enabled ?? false,
            'eod_email'             => $setting?->eod_report_email ?? '',
            'weekly_enabled'        => $setting?->weekly_report_enabled ?? false,
            'weekly_day'            => $setting?->weekly_report_day ?? 1, // 1=Mon
            'weekly_email'          => $setting?->weekly_report_email ?? '',
            'monthly_enabled'       => $setting?->monthly_report_enabled ?? false,
            'monthly_email'         => $setting?->monthly_report_email ?? '',
        ], 'Report schedule');
    }

    /**
     * PUT /outlet/reports/schedule
     */
    public function updateSchedule(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'eod_enabled'        => 'nullable|boolean',
            'eod_email'          => 'nullable|email',
            'weekly_enabled'     => 'nullable|boolean',
            'weekly_day'         => 'nullable|integer|between:1,7',
            'weekly_email'       => 'nullable|email',
            'monthly_enabled'    => 'nullable|boolean',
            'monthly_email'      => 'nullable|email',
        ]);

        $outletId = (int) $request->header('X-Outlet-Id');
        $map = [
            'eod_enabled'    => 'eod_report_enabled',
            'eod_email'      => 'eod_report_email',
            'weekly_enabled' => 'weekly_report_enabled',
            'weekly_day'     => 'weekly_report_day',
            'weekly_email'   => 'weekly_report_email',
            'monthly_enabled'=> 'monthly_report_enabled',
            'monthly_email'  => 'monthly_report_email',
        ];

        $data = collect($validated)->mapWithKeys(fn ($v, $k) => [$map[$k] => $v])->toArray();

        OutletSetting::updateOrCreate(
            ['outlet_id' => $outletId],
            array_merge($data, ['tenant_id' => app('tenant')->id])
        );

        return ApiResponse::success(null, 'Jadwal laporan disimpan');
    }
}
