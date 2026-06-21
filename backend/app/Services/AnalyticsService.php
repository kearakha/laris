<?php

namespace App\Services;

use App\Enums\OrderStatus;
use App\Enums\PaymentStatus;
use App\Models\Order;
use App\Models\OrderItem;
use Illuminate\Support\Facades\DB;

class AnalyticsService
{
    public function getDashboard(int $outletId, string $dateFrom, string $dateTo): array
    {
        $baseQuery = Order::where('outlet_id', $outletId)
            ->whereNotIn('status', [OrderStatus::Cancelled])
            ->whereBetween(DB::raw('DATE(created_at)'), [$dateFrom, $dateTo]);

        // Revenue
        $revenueData = (clone $baseQuery)
            ->where('payment_status', PaymentStatus::Paid)
            ->selectRaw('SUM(total) as total_revenue, COUNT(*) as total_orders, AVG(total) as avg_order_value')
            ->first();

        // Revenue by day
        $revenueByDay = (clone $baseQuery)
            ->where('payment_status', PaymentStatus::Paid)
            ->selectRaw('DATE(created_at) as date, SUM(total) as revenue, COUNT(*) as orders')
            ->groupBy('date')
            ->orderBy('date')
            ->get();

        // Revenue by order type
        $revenueByType = (clone $baseQuery)
            ->where('payment_status', PaymentStatus::Paid)
            ->selectRaw('type, SUM(total) as revenue, COUNT(*) as orders')
            ->groupBy('type')
            ->get();

        // Top menu items
        $topItems = OrderItem::whereHas('order', function ($q) use ($outletId, $dateFrom, $dateTo) {
                $q->where('outlet_id', $outletId)
                  ->whereNotIn('status', [OrderStatus::Cancelled])
                  ->whereBetween(DB::raw('DATE(created_at)'), [$dateFrom, $dateTo]);
            })
            ->selectRaw('menu_item_id, menu_item_name, SUM(quantity) as total_sold, SUM(subtotal) as total_revenue')
            ->groupBy('menu_item_id', 'menu_item_name')
            ->orderByDesc('total_sold')
            ->limit(10)
            ->get();

        // Hourly traffic
        $hourlyTraffic = (clone $baseQuery)
            ->selectRaw('HOUR(created_at) as hour, COUNT(*) as orders')
            ->groupBy('hour')
            ->orderBy('hour')
            ->get();

        // Payment method breakdown
        $paymentBreakdown = DB::table('payments')
            ->join('orders', 'payments.order_id', '=', 'orders.id')
            ->where('orders.outlet_id', $outletId)
            ->where('payments.status', 'success')
            ->whereBetween(DB::raw('DATE(payments.created_at)'), [$dateFrom, $dateTo])
            ->selectRaw('payments.method, COUNT(*) as count, SUM(payments.amount) as amount')
            ->groupBy('payments.method')
            ->get();

        // Unpaid orders today
        $unpaidOrders = Order::where('outlet_id', $outletId)
            ->whereDate('created_at', today())
            ->where('payment_status', PaymentStatus::Unpaid)
            ->whereNotIn('status', [OrderStatus::Cancelled])
            ->count();

        return [
            'summary' => [
                'total_revenue'    => (float) ($revenueData->total_revenue ?? 0),
                'total_orders'     => (int) ($revenueData->total_orders ?? 0),
                'avg_order_value'  => round((float) ($revenueData->avg_order_value ?? 0), 2),
                'unpaid_orders'    => $unpaidOrders,
            ],
            'revenue_by_day'    => $revenueByDay,
            'revenue_by_type'   => $revenueByType,
            'top_items'         => $topItems,
            'hourly_traffic'    => $hourlyTraffic,
            'payment_breakdown' => $paymentBreakdown,
        ];
    }
}
