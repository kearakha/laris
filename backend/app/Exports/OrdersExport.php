<?php

namespace App\Exports;

use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\WithTitle;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class OrdersExport implements FromCollection, ShouldAutoSize, WithHeadings, WithMapping, WithStyles, WithTitle
{
    public function __construct(
        private $orders,
        private string $from,
        private string $to
    ) {}

    public function collection()
    {
        return $this->orders;
    }

    public function headings(): array
    {
        return [
            'No. Order',
            'Tanggal & Waktu',
            'Tipe',
            'Meja',
            'Status',
            'Status Bayar',
            'Item',
            'Subtotal',
            'Diskon',
            'Pajak',
            'Total',
        ];
    }

    public function map($order): array
    {
        $items = $order->orderItems
            ->map(fn ($i) => "{$i->menu_item_name} x{$i->quantity}")
            ->implode('; ');

        return [
            $order->order_number,
            $order->created_at->format('d/m/Y H:i'),
            $order->type,
            $order->table?->name ?? '-',
            $order->status,
            $order->payment_status,
            $items,
            $order->subtotal,
            $order->discount_amount,
            $order->tax_amount,
            $order->total,
        ];
    }

    public function styles(Worksheet $sheet): array
    {
        return [
            1 => [
                'font' => ['bold' => true, 'color' => ['rgb' => 'FFFFFF']],
                'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => '1D4ED8']],
                'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER],
            ],
        ];
    }

    public function title(): string
    {
        return "Orders {$this->from} - {$this->to}";
    }
}
