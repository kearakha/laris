'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts'
import { TrendingUp, ShoppingBag, Banknote, AlertCircle } from 'lucide-react'
import { useAuthStore } from '@/lib/stores/authStore'
import { formatRupiah } from '@/lib/utils'
import apiClient from '@/lib/api/client'

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']

function StatCard({ title, value, icon: Icon, sub }: { title: string; value: string; icon: React.ElementType; sub?: string }) {
  return (
    <div className="bg-card border rounded-xl p-5">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm text-muted-foreground">{title}</p>
        <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
          <Icon className="h-4.5 w-4.5 text-primary" />
        </div>
      </div>
      <p className="text-2xl font-bold">{value}</p>
      {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
    </div>
  )
}

export default function AnalyticsPage() {
  const { user } = useAuthStore()
  const outletId = user?.outlet?.id

  const today = new Date()
  const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0]
  const todayStr = today.toISOString().split('T')[0]

  const [dateFrom, setDateFrom] = useState(firstOfMonth)
  const [dateTo, setDateTo] = useState(todayStr)

  const headers = outletId ? { 'X-Outlet-Id': String(outletId) } : {}

  const { data, isLoading } = useQuery({
    queryKey: ['analytics', outletId, dateFrom, dateTo],
    queryFn: () => apiClient.get('/api/v1/outlet/analytics/dashboard', {
      params: { date_from: dateFrom, date_to: dateTo },
      headers,
    }),
  })

  const d = data?.data?.data
  if (isLoading || !d) {
    return (
      <div className="p-6 max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Analitik</h1>
        <div className="text-sm text-muted-foreground">Memuat data...</div>
      </div>
    )
  }

  const { summary, revenue_by_day, revenue_by_type, top_items, hourly_traffic, payment_breakdown } = d

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Analitik</h1>
          <p className="text-muted-foreground text-sm">Laporan penjualan dan performa outlet</p>
        </div>
        <div className="flex gap-2 items-center text-sm">
          <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="border rounded-lg px-3 py-1.5 text-sm bg-background" />
          <span className="text-muted-foreground">—</span>
          <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="border rounded-lg px-3 py-1.5 text-sm bg-background" />
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="Total Pendapatan"
          value={formatRupiah(summary.total_revenue)}
          icon={Banknote}
        />
        <StatCard
          title="Total Order"
          value={summary.total_orders.toLocaleString('id-ID')}
          icon={ShoppingBag}
        />
        <StatCard
          title="Rata-rata Order"
          value={formatRupiah(summary.avg_order_value)}
          icon={TrendingUp}
        />
        <StatCard
          title="Order Belum Bayar"
          value={String(summary.unpaid_orders)}
          icon={AlertCircle}
          sub="hari ini"
        />
      </div>

      {/* Revenue by day */}
      {revenue_by_day.length > 0 && (
        <div className="bg-card border rounded-xl p-5">
          <h2 className="font-semibold mb-4">Pendapatan Harian</h2>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={revenue_by_day}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={v => v.slice(5)} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `${(v / 1000000).toFixed(0)}M`} />
              <Tooltip formatter={(v: unknown) => formatRupiah(v as number)} labelFormatter={l => `Tanggal: ${l}`} />
              <Line type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-4">
        {/* Top items */}
        {top_items.length > 0 && (
          <div className="bg-card border rounded-xl p-5">
            <h2 className="font-semibold mb-4">Menu Terlaris</h2>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={top_items.slice(0, 8)} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="menu_item_name" width={110} tick={{ fontSize: 10 }} />
                <Tooltip formatter={(v: unknown) => `${v} terjual`} />
                <Bar dataKey="total_sold" fill="#6366f1" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Payment breakdown */}
        {payment_breakdown.length > 0 && (
          <div className="bg-card border rounded-xl p-5">
            <h2 className="font-semibold mb-4">Metode Pembayaran</h2>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={payment_breakdown}
                  dataKey="count"
                  nameKey="method"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={({ name, percent }: { name?: string; percent?: number }) => `${name ?? ''} ${((percent ?? 0) * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {payment_breakdown.map((_: unknown, i: number) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: unknown) => `${v} transaksi`} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Hourly traffic */}
      {hourly_traffic.length > 0 && (
        <div className="bg-card border rounded-xl p-5">
          <h2 className="font-semibold mb-4">Traffic Per Jam</h2>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={hourly_traffic}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="hour" tick={{ fontSize: 11 }} tickFormatter={v => `${v}:00`} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip labelFormatter={l => `Jam ${l}:00`} formatter={(v: unknown) => `${v} order`} />
              <Bar dataKey="orders" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Revenue by type */}
      {revenue_by_type.length > 0 && (
        <div className="bg-card border rounded-xl p-5">
          <h2 className="font-semibold mb-3">Pendapatan per Tipe Order</h2>
          <div className="grid grid-cols-3 gap-3">
            {revenue_by_type.map((t: { type: string; revenue: number; orders: number }) => (
              <div key={t.type} className="text-center p-3 bg-muted/30 rounded-lg">
                <p className="text-xs text-muted-foreground capitalize mb-1">{t.type.replace('_', ' ')}</p>
                <p className="font-semibold text-sm">{formatRupiah(t.revenue)}</p>
                <p className="text-xs text-muted-foreground">{t.orders} order</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
