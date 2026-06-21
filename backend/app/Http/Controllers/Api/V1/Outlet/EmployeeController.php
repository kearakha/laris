<?php

namespace App\Http\Controllers\Api\V1\Outlet;

use App\Http\Controllers\Controller;
use App\Helpers\ApiResponse;
use App\Models\Employee;
use App\Models\Shift;
use App\Models\ShiftAssignment;
use App\Models\Attendance;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class EmployeeController extends Controller
{
    private function outletId(Request $request): int
    {
        return (int) ($request->header('X-Outlet-Id') ?? app('tenant')->outlets()->value('id'));
    }

    // ── Employees ──────────────────────────────────────────────────────────

    public function index(Request $request)
    {
        $employees = Employee::where('outlet_id', $this->outletId($request))
            ->with('user:id,name,email,phone,avatar')
            ->get();

        return ApiResponse::success($employees);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name'          => 'required|string|max:255',
            'email'         => 'nullable|email|unique:users,email',
            'phone'         => 'nullable|string|max:20',
            'password'      => 'required|string|min:6',
            'role'          => 'required|string|in:kasir,inventory_staff,kitchen_staff,supervisor,outlet_manager',
            'position'      => 'required|string|max:255',
            'salary_type'   => 'in:monthly,daily,hourly',
            'salary_amount' => 'nullable|numeric|min:0',
            'hired_at'      => 'required|date',
        ]);

        $tenant = app('tenant');
        $outletId = $this->outletId($request);

        $user = User::create([
            'tenant_id' => $tenant->id,
            'outlet_id' => $outletId,
            'name'      => $data['name'],
            'email'     => $data['email'] ?? null,
            'phone'     => $data['phone'] ?? null,
            'password'  => Hash::make($data['password']),
        ]);

        $user->assignRole($data['role']);

        $employee = Employee::create([
            'user_id'       => $user->id,
            'tenant_id'     => $tenant->id,
            'outlet_id'     => $outletId,
            'employee_code' => 'EMP-' . strtoupper(Str::random(6)),
            'position'      => $data['position'],
            'salary_type'   => $data['salary_type'] ?? 'monthly',
            'salary_amount' => $data['salary_amount'] ?? 0,
            'hired_at'      => $data['hired_at'],
        ]);

        return ApiResponse::success($employee->load('user'), 'Karyawan ditambahkan', 201);
    }

    public function update(Request $request, Employee $employee)
    {
        $data = $request->validate([
            'position'      => 'sometimes|string|max:255',
            'salary_type'   => 'sometimes|in:monthly,daily,hourly',
            'salary_amount' => 'sometimes|numeric|min:0',
        ]);

        $employee->update($data);

        if ($request->filled('role')) {
            $employee->user->syncRoles([$request->role]);
        }

        return ApiResponse::success($employee->load('user'), 'Karyawan diupdate');
    }

    // ── Shifts ────────────────────────────────────────────────────────────

    public function shifts(Request $request)
    {
        $shifts = Shift::where('outlet_id', $this->outletId($request))->get();
        return ApiResponse::success($shifts);
    }

    public function createShift(Request $request)
    {
        $data = $request->validate([
            'name'       => 'required|string|max:100',
            'start_time' => 'required|date_format:H:i',
            'end_time'   => 'required|date_format:H:i',
        ]);

        $shift = Shift::create(array_merge($data, [
            'outlet_id' => $this->outletId($request),
            'tenant_id' => app('tenant')->id,
        ]));

        return ApiResponse::success($shift, 'Shift dibuat', 201);
    }

    // ── Shift Assignments ─────────────────────────────────────────────────

    public function assignShift(Request $request)
    {
        $data = $request->validate([
            'employee_id' => 'required|exists:employees,id',
            'shift_id'    => 'required|exists:shifts,id',
            'date'        => 'required|date',
        ]);

        $assignment = ShiftAssignment::updateOrCreate(
            ['employee_id' => $data['employee_id'], 'date' => $data['date']],
            ['shift_id' => $data['shift_id'], 'status' => 'scheduled']
        );

        return ApiResponse::success($assignment, 'Shift ditugaskan');
    }

    public function schedule(Request $request)
    {
        $outletId = $this->outletId($request);
        $date = $request->get('date', today()->toDateString());

        $assignments = ShiftAssignment::whereHas('employee', fn ($q) => $q->where('outlet_id', $outletId))
            ->whereDate('date', $date)
            ->with('employee.user:id,name', 'shift')
            ->get();

        return ApiResponse::success($assignments);
    }

    // ── Attendance ────────────────────────────────────────────────────────

    public function attendance(Request $request)
    {
        $outletId = $this->outletId($request);
        $date = $request->get('date', today()->toDateString());

        $attendances = Attendance::where('outlet_id', $outletId)
            ->whereDate('date', $date)
            ->with('employee.user:id,name')
            ->get();

        return ApiResponse::success($attendances);
    }

    public function clockIn(Request $request, Employee $employee)
    {
        $today = today()->toDateString();

        $existing = Attendance::where('employee_id', $employee->id)->whereDate('date', $today)->first();
        if ($existing?->clock_in) {
            return ApiResponse::error('Sudah clock in hari ini', 422);
        }

        $attendance = Attendance::updateOrCreate(
            ['employee_id' => $employee->id, 'date' => $today],
            [
                'outlet_id' => $employee->outlet_id,
                'clock_in'  => now(),
                'status'    => 'present',
            ]
        );

        return ApiResponse::success($attendance, 'Clock in berhasil');
    }

    public function clockOut(Request $request, Employee $employee)
    {
        $attendance = Attendance::where('employee_id', $employee->id)
            ->whereDate('date', today())
            ->whereNotNull('clock_in')
            ->whereNull('clock_out')
            ->first();

        if (! $attendance) {
            return ApiResponse::error('Tidak ada sesi clock in aktif', 422);
        }

        $attendance->update(['clock_out' => now()]);

        return ApiResponse::success($attendance, 'Clock out berhasil');
    }
}
