<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8">
<style>
  body { font-family: sans-serif; font-size: 13px; color: #111; margin: 24px; }
  h1 { font-size: 20px; margin-bottom: 4px; }
  h2 { font-size: 15px; margin-top: 24px; margin-bottom: 8px; color: #1D4ED8; }
  .meta { color: #666; font-size: 12px; margin-bottom: 20px; }
  .grid { display: table; width: 100%; border-collapse: collapse; margin-bottom: 8px; }
  .row { display: table-row; }
  .cell { display: table-cell; padding: 6px 10px; border-bottom: 1px solid #eee; }
  .label { font-weight: bold; width: 45%; background: #f8f9fa; }
  .value { text-align: right; }
  table { width: 100%; border-collapse: collapse; }
  th { background: #1D4ED8; color: #fff; text-align: left; padding: 6px 8px; font-size: 11px; text-transform: uppercase; }
  td { padding: 6px 8px; border-bottom: 1px solid #eee; }
  td.num { text-align: right; }
  .footer { margin-top: 28px; font-size: 11px; color: #999; }
  .highlight { font-weight: bold; font-size: 15px; color: #059669; }
</style>
</head>
<body>
  <h1>Laporan Ringkasan</h1>
  <div class="meta">Periode: {{ $from }} — {{ $to }} &nbsp;·&nbsp; Diekspor: {{ now()->format('d/m/Y H:i') }}</div>

  <h2>Ikhtisar</h2>
  @php $s = $data['summary'] ?? []; @endphp
  <div class="grid">
    <div class="row">
      <div class="cell label">Total Revenue</div>
      <div class="cell value highlight">Rp {{ number_format($s['total_revenue'] ?? 0, 0, ',', '.') }}</div>
    </div>
    <div class="row">
      <div class="cell label">Total Order</div>
      <div class="cell value">{{ number_format($s['total_orders'] ?? 0, 0, ',', '.') }}</div>
    </div>
    <div class="row">
      <div class="cell label">Rata-rata Order</div>
      <div class="cell value">Rp {{ number_format($s['avg_order_value'] ?? 0, 0, ',', '.') }}</div>
    </div>
    <div class="row">
      <div class="cell label">Order Belum Bayar</div>
      <div class="cell value">{{ $s['unpaid_orders'] ?? 0 }}</div>
    </div>
    <div class="row">
      <div class="cell label">Total Diskon</div>
      <div class="cell value">Rp {{ number_format($s['total_discount'] ?? 0, 0, ',', '.') }}</div>
    </div>
    <div class="row">
      <div class="cell label">Total Pajak</div>
      <div class="cell value">Rp {{ number_format($s['total_tax'] ?? 0, 0, ',', '.') }}</div>
    </div>
  </div>

  @if(!empty($data['top_items']))
  <h2>Top Item Terlaris</h2>
  <table>
    <thead>
      <tr>
        <th>#</th>
        <th>Nama Item</th>
        <th style="text-align:right">Qty Terjual</th>
        <th style="text-align:right">Revenue</th>
      </tr>
    </thead>
    <tbody>
      @foreach($data['top_items'] as $i => $item)
      <tr>
        <td>{{ $i + 1 }}</td>
        <td>{{ $item['name'] }}</td>
        <td class="num">{{ number_format($item['total_qty'], 0, ',', '.') }}</td>
        <td class="num">Rp {{ number_format($item['total_revenue'] ?? 0, 0, ',', '.') }}</td>
      </tr>
      @endforeach
    </tbody>
  </table>
  @endif

  @if(!empty($data['revenue_by_day']))
  <h2>Revenue Harian</h2>
  <table>
    <thead>
      <tr>
        <th>Tanggal</th>
        <th style="text-align:right">Revenue</th>
        <th style="text-align:right">Order</th>
      </tr>
    </thead>
    <tbody>
      @foreach($data['revenue_by_day'] as $day)
      <tr>
        <td>{{ $day['date'] }}</td>
        <td class="num">Rp {{ number_format($day['revenue'], 0, ',', '.') }}</td>
        <td class="num">{{ $day['orders'] }}</td>
      </tr>
      @endforeach
    </tbody>
  </table>
  @endif

  <div class="footer">LARIS · larisapp.id · Laporan ini dibuat otomatis oleh sistem</div>
</body>
</html>
