"use client";

import { useQuery } from "@tanstack/react-query";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";
import {
  Banknote,
  ShoppingBag,
  TrendingUp,
  AlertCircle,
  Users,
  Package,
  Star,
  Clock,
} from "lucide-react";
import { useAuthStore } from "@/lib/stores/authStore";
import { formatRupiah } from "@/lib/utils";
import apiClient from "@/lib/api/client";

function StatCard({
  title,
  value,
  sub,
  icon: Icon,
  color = "text-primary",
}: {
  title: string;
  value: string;
  sub?: string;
  icon: React.ElementType;
  color?: string;
}) {
  return (
    <div className="bg-card border rounded-xl p-5">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm text-muted-foreground">{title}</p>
        <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
          <Icon className={`h-4.5 w-4.5 ${color}`} />
        </div>
      </div>
      <p className="text-2xl font-bold">{value}</p>
      {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
    </div>
  );
}

export default function OwnerDashboardPage() {
  const { user } = useAuthStore();
  const userOutletId = user?.outlet?.id;

  const today = new Date();
  const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
    .toISOString()
    .split("T")[0];
  const todayStr = today.toISOString().split("T")[0];

  const outletId = userOutletId;
  const headers = outletId ? { "X-Outlet-Id": String(outletId) } : {};

  const { data: analyticsData, isLoading } = useQuery({
    queryKey: ["owner-dashboard-analytics"],
    queryFn: () =>
      apiClient.get("/api/v1/outlet/analytics/dashboard", {
        params: { date_from: firstOfMonth, date_to: todayStr },
      }),
  });

  const { data: ordersData } = useQuery({
    queryKey: ["owner-dashboard-orders"],
    queryFn: () =>
      apiClient.get("/api/v1/outlet/orders", {
        params: { status: "pending,confirmed,preparing", per_page: 5 },
      }),
  });

  const { data: stockData } = useQuery({
    queryKey: ["owner-dashboard-stock"],
    queryFn: () =>
      apiClient.get("/api/v1/outlet/inventory/ingredients", {
        params: { low_stock: true, per_page: 5 },
      }),
  });

  const d = analyticsData?.data?.data;
  const activeOrders = ordersData?.data?.data ?? [];
  const lowStockItems = stockData?.data?.data ?? [];

  const greeting = () => {
    const h = today.getHours();
    if (h < 11) return "Selamat pagi";
    if (h < 15) return "Selamat siang";
    if (h < 18) return "Selamat sore";
    return "Selamat malam";
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">
          {greeting()}, {user?.name?.split(" ")[0]} 👋
        </h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          Ringkasan performa bulan{" "}
          {today.toLocaleDateString("id-ID", {
            month: "long",
            year: "numeric",
          })}
        </p>
      </div>

      {/* Stats */}
      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="bg-card border rounded-xl p-5 h-28 animate-pulse bg-muted/30"
            />
          ))}
        </div>
      ) : d ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            title="Pendapatan Bulan Ini"
            value={formatRupiah(d.summary?.total_revenue ?? 0)}
            icon={Banknote}
          />
          <StatCard
            title="Total Order"
            value={(d.summary?.total_orders ?? 0).toLocaleString("id-ID")}
            sub="bulan ini"
            icon={ShoppingBag}
          />
          <StatCard
            title="Rata-rata per Order"
            value={formatRupiah(d.summary?.avg_order_value ?? 0)}
            icon={TrendingUp}
          />
          <StatCard
            title="Belum Dibayar"
            value={String(d.summary?.unpaid_orders ?? 0)}
            sub="order aktif"
            icon={AlertCircle}
            color="text-destructive"
          />
        </div>
      ) : null}

      <div className="grid md:grid-cols-2 gap-6">
        {/* Revenue chart */}
        {d?.revenue_by_day?.length > 0 && (
          <div className="bg-card border rounded-xl p-5">
            <h2 className="font-semibold mb-4">Pendapatan Harian</h2>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={d.revenue_by_day}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="hsl(var(--border))"
                />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 10 }}
                  tickFormatter={(v) => v.slice(5)}
                />
                <YAxis
                  tick={{ fontSize: 10 }}
                  tickFormatter={(v) => `${(v / 1000000).toFixed(0)}M`}
                />
                <Tooltip
                  formatter={(v: unknown) => formatRupiah(v as number)}
                  labelFormatter={(l) => `${l}`}
                />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="#6366f1"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Top menu */}
        {d?.top_items?.length > 0 && (
          <div className="bg-card border rounded-xl p-5">
            <h2 className="font-semibold mb-4">Menu Terlaris Bulan Ini</h2>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={d.top_items.slice(0, 5)} layout="vertical">
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="hsl(var(--border))"
                />
                <XAxis type="number" tick={{ fontSize: 10 }} />
                <YAxis
                  type="category"
                  dataKey="menu_item_name"
                  width={100}
                  tick={{ fontSize: 10 }}
                />
                <Tooltip formatter={(v: unknown) => `${v} terjual`} />
                <Bar
                  dataKey="total_sold"
                  fill="#10b981"
                  radius={[0, 4, 4, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Active orders */}
        <div className="bg-card border rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">Order Aktif</h2>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </div>
          {activeOrders.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Tidak ada order aktif saat ini.
            </p>
          ) : (
            <div className="space-y-2">
              {activeOrders.map(
                (order: {
                  id: number;
                  order_number: string;
                  status: string;
                  total: number;
                  type: string;
                }) => (
                  <div
                    key={order.id}
                    className="flex items-center justify-between py-2 border-b last:border-0"
                  >
                    <div>
                      <p className="text-sm font-medium">
                        #{order.order_number}
                      </p>
                      <p className="text-xs text-muted-foreground capitalize">
                        {order.type?.replace("_", " ")}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold">
                        {formatRupiah(order.total)}
                      </p>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 capitalize">
                        {order.status}
                      </span>
                    </div>
                  </div>
                ),
              )}
            </div>
          )}
        </div>

        {/* Low stock */}
        <div className="bg-card border rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">Stok Hampir Habis</h2>
            <Package className="h-4 w-4 text-muted-foreground" />
          </div>
          {lowStockItems.length === 0 ? (
            <p className="text-sm text-muted-foreground">Semua stok aman.</p>
          ) : (
            <div className="space-y-2">
              {lowStockItems.map(
                (item: {
                  id: number;
                  name: string;
                  current_stock: number;
                  min_stock: number;
                  unit: string;
                }) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between py-2 border-b last:border-0"
                  >
                    <p className="text-sm font-medium">{item.name}</p>
                    <div className="text-right">
                      <p className="text-sm text-destructive font-semibold">
                        {item.current_stock} {item.unit}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        min: {item.min_stock} {item.unit}
                      </p>
                    </div>
                  </div>
                ),
              )}
            </div>
          )}
        </div>
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "POS Kasir", href: "/outlet/pos", icon: ShoppingBag },
          { label: "Menu", href: "/outlet/menu", icon: Star },
          { label: "Inventory", href: "/outlet/inventory", icon: Package },
          { label: "Karyawan", href: "/outlet/employees", icon: Users },
        ].map(({ label, href, icon: Icon }) => (
          <a
            key={href}
            href={href}
            className="flex items-center gap-3 bg-card border rounded-xl p-4 hover:bg-muted/40 transition-colors"
          >
            <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <Icon className="h-4.5 w-4.5 text-primary" />
            </div>
            <span className="text-sm font-medium">{label}</span>
          </a>
        ))}
      </div>
    </div>
  );
}
