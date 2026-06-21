<?php

namespace App\Exports;

use Maatwebsite\Excel\Concerns\FromArray;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMultipleSheets;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\WithTitle;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class SummaryExport implements WithMultipleSheets
{
    public function __construct(
        private array $data,
        private string $from,
        private string $to
    ) {}

    public function sheets(): array
    {
        return [
            new SummaryOverviewSheet($this->data, $this->from, $this->to),
            new SummaryTopItemsSheet($this->data['top_items'] ?? []),
        ];
    }
}

class SummaryOverviewSheet implements FromArray, ShouldAutoSize, WithStyles, WithTitle
{
    public function __construct(
        private array $data,
        private string $from,
        private string $to
    ) {}

    public function array(): array
    {
        $s = $this->data['summary'] ?? [];

        return [
            ['Metrik', 'Nilai'],
            ['Periode', "{$this->from} — {$this->to}"],
            ['Total Revenue', $s['total_revenue'] ?? 0],
            ['Total Order', $s['total_orders'] ?? 0],
            ['Rata-rata Order', $s['avg_order_value'] ?? 0],
            ['Order Belum Bayar', $s['unpaid_orders'] ?? 0],
            ['Total Diskon', $s['total_discount'] ?? 0],
            ['Total Pajak', $s['total_tax'] ?? 0],
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
        return 'Ringkasan';
    }
}

class SummaryTopItemsSheet implements FromArray, ShouldAutoSize, WithHeadings, WithStyles, WithTitle
{
    public function __construct(private array $items) {}

    public function array(): array
    {
        return collect($this->items)
            ->map(fn ($item) => [
                $item['name'],
                $item['total_qty'],
                $item['total_revenue'] ?? 0,
            ])
            ->toArray();
    }

    public function headings(): array
    {
        return ['Nama Item', 'Qty Terjual', 'Total Revenue'];
    }

    public function styles(Worksheet $sheet): array
    {
        return [
            1 => [
                'font' => ['bold' => true, 'color' => ['rgb' => 'FFFFFF']],
                'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => '059669']],
                'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER],
            ],
        ];
    }

    public function title(): string
    {
        return 'Top Items';
    }
}
