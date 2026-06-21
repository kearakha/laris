<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8">
<style>
  body { font-family: sans-serif; color: #1a1a1a; background: #f5f5f5; margin: 0; padding: 0; }
  .wrap { max-width: 560px; margin: 32px auto; background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,.08); }
  .header { background: #1d4ed8; color: #fff; padding: 24px 32px; }
  .header h1 { margin: 0; font-size: 20px; }
  .header p { margin: 4px 0 0; opacity: .8; font-size: 13px; }
  .body { padding: 24px 32px; }
  .stat { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #f0f0f0; }
  .stat-label { color: #666; font-size: 14px; }
  .stat-value { font-weight: 700; font-size: 15px; }
  .section-title { font-size: 13px; font-weight: 600; color: #888; text-transform: uppercase; letter-spacing: .04em; margin: 20px 0 8px; }
  .item-row { display: flex; justify-content: space-between; font-size: 13px; padding: 4px 0; }
  .footer { background: #f9f9f9; padding: 16px 32px; font-size: 12px; color: #999; text-align: center; }
</style>
</head>
<body>
<div class="wrap">
  <div class="header">
    <h1>📊 Laporan End of Day</h1>
    <p>{{ $outletName }} · {{ $date }}</p>
  </div>
  <div class="body">
    <div class="stat">
      <span class="stat-label">Total Revenue</span>
      <span class="stat-value">Rp {{ number_format($summary['total_revenue'] ?? 0, 0, ',', '.') }}</span>
    </div>
    <div class="stat">
      <span class="stat-label">Total Order</span>
      <span class="stat-value">{{ $summary['total_orders'] ?? 0 }}</span>
    </div>
    <div class="stat">
      <span class="stat-label">Rata-rata Order</span>
      <span class="stat-value">Rp {{ number_format($summary['avg_order_value'] ?? 0, 0, ',', '.') }}</span>
    </div>
    <div class="stat">
      <span class="stat-label">Order Belum Bayar</span>
      <span class="stat-value">{{ $summary['unpaid_orders'] ?? 0 }}</span>
    </div>

    @if($topItems->count())
    <div class="section-title">Menu Terlaris Hari Ini</div>
    @foreach($topItems as $item)
    <div class="item-row">
      <span>{{ $item['name'] ?? '-' }}</span>
      <span><strong>{{ $item['total_qty'] ?? 0 }}x</strong></span>
    </div>
    @endforeach
    @endif
  </div>
  <div class="footer">
    Laporan otomatis dikirim oleh <strong>LARIS</strong> · larisapp.id
  </div>
</div>
</body>
</html>
