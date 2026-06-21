<?php

namespace App\Http\Controllers\Api\V1\Outlet;

use App\Exports\OrdersExport;
use App\Exports\SummaryExport;
use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Services\AnalyticsService;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Maatwebsite\Excel\Facades\Excel;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class ExportController extends Controller
{
    public function __construct(private AnalyticsService $analytics) {}

    /**
     * GET /outlet/export/orders?date_from=&date_to=&format=csv|xlsx|pdf
     */
    public function orders(Request $request): Response|BinaryFileResponse
    {
        $outletId = (int) $request->header('X-Outlet-Id');
        $from = $request->input('date_from', now()->startOfMonth()->toDateString());
        $to = $request->input('date_to', now()->toDateString());
        $format = $request->input('format', 'xlsx');

        $orders = Order::where('outlet_id', $outletId)
            ->with(['table:id,name', 'orderItems:id,order_id,menu_item_name,quantity,subtotal'])
            ->whereBetween('created_at', [$from.' 00:00:00', $to.' 23:59:59'])
            ->orderBy('created_at')
            ->get();

        return match ($format) {
            'pdf' => $this->ordersPdf($orders, $from, $to),
            'csv' => $this->ordersCsv($orders, $from, $to),
            default => Excel::download(new OrdersExport($orders, $from, $to), "orders_{$from}_{$to}.xlsx"),
        };
    }

    /**
     * GET /outlet/export/summary?date_from=&date_to=&format=csv|xlsx|pdf
     */
    public function summary(Request $request): Response|BinaryFileResponse
    {
        $outletId = (int) $request->header('X-Outlet-Id');
        $from = $request->input('date_from', now()->startOfMonth()->toDateString());
        $to = $request->input('date_to', now()->toDateString());
        $format = $request->input('format', 'xlsx');

        $data = $this->analytics->getDashboard($outletId, $from, $to);

        return match ($format) {
            'pdf' => $this->summaryPdf($data, $from, $to),
            'csv' => $this->summaryCsv($data, $from, $to),
            default => Excel::download(new SummaryExport($data, $from, $to), "summary_{$from}_{$to}.xlsx"),
        };
    }

    private function ordersPdf($orders, string $from, string $to): Response
    {
        $pdf = Pdf::loadView('exports.orders', compact('orders', 'from', 'to'))
            ->setPaper('a4', 'landscape');

        return response($pdf->output(), 200, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => "attachment; filename=orders_{$from}_{$to}.pdf",
        ]);
    }

    private function summaryPdf(array $data, string $from, string $to): Response
    {
        $pdf = Pdf::loadView('exports.summary', compact('data', 'from', 'to'))
            ->setPaper('a4', 'portrait');

        return response($pdf->output(), 200, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => "attachment; filename=summary_{$from}_{$to}.pdf",
        ]);
    }

    private function ordersCsv($orders, string $from, string $to): Response
    {
        $rows = [['No. Order', 'Tanggal & Waktu', 'Tipe', 'Meja', 'Status', 'Status Bayar', 'Item', 'Subtotal', 'Diskon', 'Pajak', 'Total']];

        foreach ($orders as $o) {
            $items = $o->orderItems->map(fn ($i) => "{$i->menu_item_name}x{$i->quantity}")->implode('; ');
            $rows[] = [
                $o->order_number,
                $o->created_at->format('d/m/Y H:i'),
                $o->type,
                $o->table?->name ?? '-',
                $o->status,
                $o->payment_status,
                $items,
                $o->subtotal,
                $o->discount_amount,
                $o->tax_amount,
                $o->total,
            ];
        }

        return $this->buildCsv($rows, "orders_{$from}_{$to}.csv");
    }

    private function summaryCsv(array $data, string $from, string $to): Response
    {
        $s = $data['summary'] ?? [];
        $rows = [
            ['Metrik', 'Nilai'],
            ['Periode', "{$from} — {$to}"],
            ['Total Revenue', $s['total_revenue'] ?? 0],
            ['Total Order', $s['total_orders'] ?? 0],
            ['Rata-rata Order', $s['avg_order_value'] ?? 0],
            ['Order Belum Bayar', $s['unpaid_orders'] ?? 0],
            [''],
            ['Nama Item', 'Qty Terjual'],
        ];

        foreach ($data['top_items'] ?? [] as $item) {
            $rows[] = [$item['name'], $item['total_qty']];
        }

        return $this->buildCsv($rows, "summary_{$from}_{$to}.csv");
    }

    private function buildCsv(array $rows, string $filename): Response
    {
        $csv = collect($rows)
            ->map(fn ($r) => implode(',', array_map(
                fn ($v) => '"'.str_replace('"', '""', (string) $v).'"',
                $r
            )))
            ->implode("\n");

        return response($csv, 200, [
            'Content-Type' => 'text/csv; charset=UTF-8',
            'Content-Disposition' => "attachment; filename={$filename}",
        ]);
    }
}
