<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8">
<style>
  body { font-family: sans-serif; font-size: 13px; color: #111; }
  h1 { font-size: 18px; margin-bottom: 4px; }
  .meta { color: #666; font-size: 12px; margin-bottom: 16px; }
  table { width: 100%; border-collapse: collapse; }
  th { background: #f0f0f0; text-align: left; padding: 6px 8px; font-size: 11px; text-transform: uppercase; }
  td { padding: 6px 8px; border-bottom: 1px solid #eee; vertical-align: top; }
  .total { font-weight: bold; }
  .footer { margin-top: 24px; font-size: 11px; color: #999; }
</style>
</head>
<body>
  <h1>Laporan Order</h1>
  <div class="meta">Periode: {{ $from }} — {{ $to }} · Diekspor: {{ now()->format('Y-m-d H:i') }}</div>
  <table>
    <thead>
      <tr>
        <th>No. Order</th>
        <th>Waktu</th>
        <th>Tipe</th>
        <th>Meja</th>
        <th>Status</th>
        <th>Bayar</th>
        <th>Item</th>
        <th style="text-align:right">Total</th>
      </tr>
    </thead>
    <tbody>
      @foreach($orders as $o)
      <tr>
        <td>{{ $o->order_number }}</td>
        <td>{{ $o->created_at->format('d/m H:i') }}</td>
        <td>{{ $o->type }}</td>
        <td>{{ $o->table?->name ?? '-' }}</td>
        <td>{{ $o->status }}</td>
        <td>{{ $o->payment_status }}</td>
        <td>{{ $o->orderItems->map(fn($i) => "{$i->menu_item_name}x{$i->quantity}")->implode(', ') }}</td>
        <td class="total" style="text-align:right">Rp {{ number_format($o->total, 0, ',', '.') }}</td>
      </tr>
      @endforeach
    </tbody>
  </table>
  <div class="footer">LARIS · larisapp.id</div>
</body>
</html>
