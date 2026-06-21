<?php

namespace App\Http\Controllers\Api\V1\Customer;

use App\Http\Controllers\Controller;
use App\Helpers\ApiResponse;
use App\Models\FeedbackComplaint;
use Illuminate\Http\Request;

class FeedbackController extends Controller
{
    public function store(Request $request)
    {
        $data = $request->validate([
            'outlet_id'     => 'required|exists:outlets,id',
            'order_id'      => 'nullable|exists:orders,id',
            'category'      => 'required|in:food,service,cleanliness,other',
            'description'   => 'required|string|max:2000',
            'contact_name'  => 'nullable|string|max:255',
            'contact_phone' => 'nullable|string|max:20',
        ]);

        $tenant = app('tenant');
        $customer = $request->user();

        $feedback = FeedbackComplaint::create([
            'tenant_id'     => $tenant->id,
            'outlet_id'     => $data['outlet_id'],
            'customer_id'   => $customer->id,
            'order_id'      => $data['order_id'] ?? null,
            'category'      => $data['category'],
            'description'   => $data['description'],
            'contact_name'  => $data['contact_name'] ?? $customer->name,
            'contact_phone' => $data['contact_phone'] ?? $customer->phone,
        ]);

        return ApiResponse::success($feedback, 'Feedback terkirim', 201);
    }
}
