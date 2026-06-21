<?php

namespace App\Http\Controllers\Api\V1\Outlet;

use App\Helpers\ApiResponse;
use App\Http\Controllers\Controller;
use App\Models\Campaign;
use App\Models\CampaignLog;
use App\Models\OutletSetting;
use App\Services\SegmentationService;
use App\Services\WhatsAppService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CampaignController extends Controller
{
    public function __construct(
        private SegmentationService $segmentation,
        private WhatsAppService $whatsApp,
    ) {}

    public function segments(Request $request): JsonResponse
    {
        $outletId = (int) $request->header('X-Outlet-Id');
        $tenantId = app('tenant')->id;
        $segment  = $request->input('segment', 'all');

        $customers = $this->segmentation->getCustomers($tenantId, $segment);

        return ApiResponse::success([
            'segment'   => $segment,
            'segments'  => SegmentationService::segments(),
            'count'     => $customers->count(),
            'customers' => $customers->take(20), // preview first 20
        ], 'Segment preview');
    }

    public function index(Request $request): JsonResponse
    {
        $outletId  = (int) $request->header('X-Outlet-Id');
        $campaigns = Campaign::where('outlet_id', $outletId)
            ->with('createdBy:id,name')
            ->latest()
            ->paginate(20);

        return ApiResponse::success($campaigns, 'Campaigns');
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name'    => 'required|string|max:100',
            'segment' => 'required|in:' . implode(',', array_keys(SegmentationService::segments())),
            'channel' => 'required|in:whatsapp',
            'message' => 'required|string|max:1000',
        ]);

        $outletId = (int) $request->header('X-Outlet-Id');
        $tenantId = app('tenant')->id;
        $count    = $this->segmentation->countCustomers($tenantId, $validated['segment']);

        $campaign = Campaign::create([
            ...$validated,
            'tenant_id'    => $tenantId,
            'outlet_id'    => $outletId,
            'created_by'   => auth()->id(),
            'target_count' => $count,
            'status'       => 'draft',
        ]);

        return ApiResponse::success($campaign, 'Campaign dibuat', 201);
    }

    public function send(Request $request, Campaign $campaign): JsonResponse
    {
        if ($campaign->status === 'sent') {
            return ApiResponse::error('Campaign sudah dikirim', 422);
        }

        $outletId = (int) $request->header('X-Outlet-Id');
        $setting  = OutletSetting::where('outlet_id', $outletId)->first();

        if ($campaign->channel === 'whatsapp' && empty($setting?->whatsapp_token)) {
            return ApiResponse::error('WhatsApp token belum dikonfigurasi di pengaturan outlet', 422);
        }

        $tenantId  = app('tenant')->id;
        $customers = $this->segmentation->getCustomers($tenantId, $campaign->segment);

        $campaign->update(['status' => 'sending', 'target_count' => $customers->count()]);

        $sent   = 0;
        $failed = 0;

        foreach ($customers as $customer) {
            if (empty($customer->phone)) {
                $failed++;
                continue;
            }

            $message = str_replace(
                ['{{name}}', '{{points}}'],
                [$customer->name, $customer->loyalty_points ?? 0],
                $campaign->message
            );

            $success = $this->whatsApp->send($setting->whatsapp_token, $customer->phone, $message);

            CampaignLog::create([
                'campaign_id' => $campaign->id,
                'customer_id' => $customer->id,
                'channel'     => $campaign->channel,
                'recipient'   => $customer->phone,
                'status'      => $success ? 'sent' : 'failed',
                'sent_at'     => $success ? now() : null,
            ]);

            $success ? $sent++ : $failed++;
        }

        $campaign->update([
            'status'       => 'sent',
            'sent_count'   => $sent,
            'failed_count' => $failed,
            'sent_at'      => now(),
        ]);

        return ApiResponse::success([
            'sent'   => $sent,
            'failed' => $failed,
        ], "Campaign terkirim: {$sent} pesan");
    }

    public function show(Campaign $campaign): JsonResponse
    {
        $campaign->load(['createdBy:id,name', 'logs' => fn ($q) => $q->latest()->limit(50)]);
        return ApiResponse::success($campaign, 'Campaign detail');
    }
}
