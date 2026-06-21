<?php

namespace App\Http\Controllers\Api\V1\Outlet;

use App\Http\Controllers\Controller;
use App\Helpers\ApiResponse;
use App\Models\Reservation;
use App\Models\WaitlistEntry;
use App\Enums\ReservationStatus;
use Illuminate\Http\Request;

class ReservationController extends Controller
{
    public function index(Request $request)
    {
        $outletId = $request->header('X-Outlet-Id', app('tenant')->outlets()->value('id'));

        $query = Reservation::where('outlet_id', $outletId)
            ->with('customer:id,name,phone', 'table:id,name');

        if ($request->filled('date')) {
            $query->whereDate('date', $request->date);
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        return ApiResponse::success($query->latest()->paginate(20));
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'guest_name'  => 'required|string|max:255',
            'guest_phone' => 'required|string|max:20',
            'party_size'  => 'required|integer|min:1',
            'date'        => 'required|date',
            'time'        => 'required|date_format:H:i',
            'table_id'    => 'nullable|exists:tables,id',
            'notes'       => 'nullable|string',
        ]);

        $outletId = $request->header('X-Outlet-Id', app('tenant')->outlets()->value('id'));
        $tenant = app('tenant');

        $reservation = Reservation::create(array_merge($data, [
            'tenant_id' => $tenant->id,
            'outlet_id' => $outletId,
            'status'    => ReservationStatus::Confirmed,
        ]));

        return ApiResponse::success($reservation, 'Reservasi dibuat', 201);
    }

    public function updateStatus(Request $request, Reservation $reservation)
    {
        $data = $request->validate([
            'status' => 'required|in:confirmed,seated,completed,cancelled,no_show',
        ]);

        $reservation->update(['status' => $data['status']]);

        return ApiResponse::success($reservation, 'Status diupdate');
    }

    // Waitlist
    public function waitlist(Request $request)
    {
        $outletId = $request->header('X-Outlet-Id', app('tenant')->outlets()->value('id'));

        $entries = WaitlistEntry::where('outlet_id', $outletId)
            ->whereIn('status', ['waiting', 'notified'])
            ->orderBy('joined_at')
            ->get();

        return ApiResponse::success($entries);
    }

    public function addWaitlist(Request $request)
    {
        $data = $request->validate([
            'guest_name'  => 'required|string|max:255',
            'guest_phone' => 'required|string|max:20',
            'party_size'  => 'required|integer|min:1',
        ]);

        $outletId = $request->header('X-Outlet-Id', app('tenant')->outlets()->value('id'));

        $entry = WaitlistEntry::create(array_merge($data, [
            'outlet_id' => $outletId,
            'tenant_id' => app('tenant')->id,
            'status'    => 'waiting',
        ]));

        return ApiResponse::success($entry, 'Ditambahkan ke waitlist', 201);
    }

    public function updateWaitlistStatus(Request $request, WaitlistEntry $entry)
    {
        $data = $request->validate([
            'status' => 'required|in:notified,seated,left',
        ]);

        $update = ['status' => $data['status']];
        if ($data['status'] === 'notified') $update['notified_at'] = now();
        if ($data['status'] === 'seated')   $update['seated_at'] = now();

        $entry->update($update);

        return ApiResponse::success($entry, 'Status diupdate');
    }
}
