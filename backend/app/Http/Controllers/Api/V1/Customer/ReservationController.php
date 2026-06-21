<?php

namespace App\Http\Controllers\Api\V1\Customer;

use App\Http\Controllers\Controller;
use App\Helpers\ApiResponse;
use App\Models\Reservation;
use App\Enums\ReservationStatus;
use Illuminate\Http\Request;

class ReservationController extends Controller
{
    public function index(Request $request)
    {
        $reservations = Reservation::where('customer_id', $request->user()->id)
            ->with('outlet:id,name', 'table:id,name')
            ->latest()
            ->paginate(15);

        return ApiResponse::success($reservations);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'outlet_id'  => 'required|exists:outlets,id',
            'date'       => 'required|date|after_or_equal:today',
            'time'       => 'required|date_format:H:i',
            'party_size' => 'required|integer|min:1|max:50',
            'notes'      => 'nullable|string|max:500',
        ]);

        $tenant = app('tenant');
        $customer = $request->user();

        $reservation = Reservation::create([
            'tenant_id'   => $tenant->id,
            'outlet_id'   => $data['outlet_id'],
            'customer_id' => $customer->id,
            'guest_name'  => $customer->name,
            'guest_phone' => $customer->phone ?? '',
            'party_size'  => $data['party_size'],
            'date'        => $data['date'],
            'time'        => $data['time'],
            'status'      => ReservationStatus::Pending,
            'notes'       => $data['notes'] ?? null,
        ]);

        return ApiResponse::success($reservation, 'Reservasi dibuat', 201);
    }

    public function show(Request $request, Reservation $reservation)
    {
        if ($reservation->customer_id !== $request->user()->id) {
            abort(403);
        }

        return ApiResponse::success($reservation->load('outlet:id,name', 'table:id,name'));
    }

    public function cancel(Request $request, Reservation $reservation)
    {
        if ($reservation->customer_id !== $request->user()->id) {
            abort(403);
        }

        if (! in_array($reservation->status, [ReservationStatus::Pending, ReservationStatus::Confirmed])) {
            return ApiResponse::error('Reservasi tidak bisa dibatalkan', 422);
        }

        $reservation->update(['status' => ReservationStatus::Cancelled]);

        return ApiResponse::success(null, 'Reservasi dibatalkan');
    }
}
