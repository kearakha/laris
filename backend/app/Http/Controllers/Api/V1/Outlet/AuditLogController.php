<?php

namespace App\Http\Controllers\Api\V1\Outlet;

use App\Http\Controllers\Controller;
use App\Helpers\ApiResponse;
use App\Models\AuditLog;
use Illuminate\Http\Request;

class AuditLogController extends Controller
{
    public function index(Request $request)
    {
        $logs = AuditLog::with('user:id,name')
            ->when($request->filled('action'), fn ($q) => $q->where('action', $request->action))
            ->when($request->filled('model_type'), fn ($q) => $q->where('model_type', $request->model_type))
            ->when($request->filled('date'), fn ($q) => $q->whereDate('created_at', $request->date))
            ->latest()
            ->paginate(30);

        return ApiResponse::success($logs);
    }
}
