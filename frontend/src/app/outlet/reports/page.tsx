"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Download, Send, Save, FileSpreadsheet, FileText } from "lucide-react";
import { toast } from "sonner";
import { useAuthStore } from "@/lib/stores/authStore";
import apiClient from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const DAYS = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"];

interface ReportSchedule {
  eod_enabled: boolean;
  eod_email: string;
  weekly_enabled: boolean;
  weekly_day: number;
  weekly_email: string;
  monthly_enabled: boolean;
  monthly_email: string;
}

const DEFAULTS: ReportSchedule = {
  eod_enabled: false,
  eod_email: "",
  weekly_enabled: false,
  weekly_day: 1,
  weekly_email: "",
  monthly_enabled: false,
  monthly_email: "",
};

export default function ReportsPage() {
  const { user } = useAuthStore();
  const outletId = user?.outlet?.id;
  const headers = outletId ? { "X-Outlet-Id": String(outletId) } : {};

  const today = new Date().toISOString().slice(0, 10);
  const monthStart = new Date(
    new Date().getFullYear(),
    new Date().getMonth(),
    1,
  )
    .toISOString()
    .slice(0, 10);

  const [exportFrom, setExportFrom] = useState(monthStart);
  const [exportTo, setExportTo] = useState(today);
  const [schedule, setSchedule] = useState<ReportSchedule>(DEFAULTS);

  const { data: scheduleData } = useQuery({
    queryKey: ["report-schedule", outletId],
    queryFn: () =>
      apiClient.get("/api/v1/outlet/reports/schedule", { headers }),
  });

  const { data: eodData } = useQuery({
    queryKey: ["eod-preview", outletId],
    queryFn: () => apiClient.get("/api/v1/outlet/reports/eod", { headers }),
  });

  useEffect(() => {
    if (scheduleData?.data?.data) {
      setSchedule((s) => ({ ...s, ...scheduleData.data.data }));
    }
  }, [scheduleData]);

  const saveMutation = useMutation({
    mutationFn: () =>
      apiClient.put("/api/v1/outlet/reports/schedule", schedule, { headers }),
    onSuccess: () => toast.success("Jadwal laporan disimpan"),
    onError: () => toast.error("Gagal menyimpan"),
  });

  const sendEodMutation = useMutation({
    mutationFn: () =>
      apiClient.post("/api/v1/outlet/reports/eod/send", {}, { headers }),
    onSuccess: () => toast.success("EOD report sedang dikirim"),
    onError: () => toast.error("Gagal mengirim EOD"),
  });

  const set = <K extends keyof ReportSchedule>(k: K, v: ReportSchedule[K]) =>
    setSchedule((s) => ({ ...s, [k]: v }));

  const eod = eodData?.data?.data?.summary;

  const [downloading, setDownloading] = useState<string | null>(null);

  const handleExport = async (
    type: "orders" | "summary",
    format: "csv" | "xlsx" | "pdf",
  ) => {
    const key = `${type}-${format}`;
    setDownloading(key);
    try {
      const token = useAuthStore.getState().token;
      const res = await fetch(
        `/api/v1/outlet/export/${type}?date_from=${exportFrom}&date_to=${exportTo}&format=${format}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "X-Outlet-Id": String(outletId),
          },
        },
      );
      if (!res.ok) throw new Error("Export gagal");
      const blob = await res.blob();
      const ext = format === "pdf" ? "pdf" : format === "xlsx" ? "xlsx" : "csv";
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${type}_${exportFrom}_${exportTo}.${ext}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error("Gagal mengunduh laporan");
    } finally {
      setDownloading(null);
    }
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Laporan & Ekspor</h1>
        <p className="text-muted-foreground text-sm">
          EOD report, jadwal otomatis, dan ekspor data
        </p>
      </div>

      {/* EOD Preview */}
      {eod && (
        <div className="border rounded-xl p-4 mb-6 bg-muted/20">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold">Ringkasan Hari Ini</h2>
            <Button
              size="sm"
              variant="outline"
              disabled={sendEodMutation.isPending}
              onClick={() => sendEodMutation.mutate()}
            >
              <Send className="h-3.5 w-3.5 mr-1" />
              {sendEodMutation.isPending ? "Mengirim..." : "Kirim EOD Sekarang"}
            </Button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              {
                label: "Revenue",
                value: `Rp ${Number(eod.total_revenue ?? 0).toLocaleString("id-ID")}`,
              },
              { label: "Order", value: eod.total_orders ?? 0 },
              {
                label: "Avg Order",
                value: `Rp ${Number(eod.avg_order_value ?? 0).toLocaleString("id-ID")}`,
              },
              { label: "Belum Bayar", value: eod.unpaid_orders ?? 0 },
            ].map((s) => (
              <div key={s.label} className="bg-white border rounded-lg p-3">
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <p className="text-sm font-bold mt-0.5">{s.value}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Export */}
      <div className="border rounded-xl p-4 mb-6">
        <h2 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <Download className="h-4 w-4" /> Ekspor Data
        </h2>
        <div className="flex gap-3 items-end mb-4">
          <div>
            <Label className="text-xs mb-1 block text-muted-foreground">
              Dari
            </Label>
            <Input
              type="date"
              value={exportFrom}
              onChange={(e) => setExportFrom(e.target.value)}
              className="w-36 text-sm h-8"
            />
          </div>
          <div>
            <Label className="text-xs mb-1 block text-muted-foreground">
              Sampai
            </Label>
            <Input
              type="date"
              value={exportTo}
              onChange={(e) => setExportTo(e.target.value)}
              className="w-36 text-sm h-8"
            />
          </div>
        </div>
        <div className="space-y-3">
          <div>
            <p className="text-xs text-muted-foreground mb-2 font-medium">
              Order
            </p>
            <div className="flex flex-wrap gap-2">
              {(["xlsx", "pdf", "csv"] as const).map((fmt) => (
                <Button
                  key={`orders-${fmt}`}
                  size="sm"
                  variant="outline"
                  disabled={downloading === `orders-${fmt}`}
                  onClick={() => handleExport("orders", fmt)}
                >
                  {fmt === "xlsx" ? (
                    <FileSpreadsheet className="h-3.5 w-3.5 mr-1" />
                  ) : (
                    <FileText className="h-3.5 w-3.5 mr-1" />
                  )}
                  {downloading === `orders-${fmt}`
                    ? "Mengunduh..."
                    : `Order ${fmt.toUpperCase()}`}
                </Button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-2 font-medium">
              Ringkasan
            </p>
            <div className="flex flex-wrap gap-2">
              {(["xlsx", "pdf", "csv"] as const).map((fmt) => (
                <Button
                  key={`summary-${fmt}`}
                  size="sm"
                  variant="outline"
                  disabled={downloading === `summary-${fmt}`}
                  onClick={() => handleExport("summary", fmt)}
                >
                  {fmt === "xlsx" ? (
                    <FileSpreadsheet className="h-3.5 w-3.5 mr-1" />
                  ) : (
                    <FileText className="h-3.5 w-3.5 mr-1" />
                  )}
                  {downloading === `summary-${fmt}`
                    ? "Mengunduh..."
                    : `Ringkasan ${fmt.toUpperCase()}`}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <Separator className="my-6" />

      {/* Schedule */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold">Jadwal Laporan Otomatis</h2>
        <Button
          size="sm"
          disabled={saveMutation.isPending}
          onClick={() => saveMutation.mutate()}
        >
          <Save className="h-3.5 w-3.5 mr-1" />
          {saveMutation.isPending ? "Menyimpan..." : "Simpan Jadwal"}
        </Button>
      </div>

      <div className="space-y-6">
        {/* EOD */}
        <div className="border rounded-lg p-4">
          <div className="flex items-center gap-3 mb-3">
            <Switch
              checked={schedule.eod_enabled}
              onCheckedChange={(v) => set("eod_enabled", v)}
            />
            <div>
              <Label className="text-sm font-medium">
                Laporan Harian (EOD)
              </Label>
              <p className="text-xs text-muted-foreground">
                Dikirim setiap hari pukul 23:00
              </p>
            </div>
          </div>
          {schedule.eod_enabled && (
            <div>
              <Label className="text-xs mb-1 block text-muted-foreground">
                Email Tujuan
              </Label>
              <Input
                type="email"
                placeholder="owner@email.com"
                value={schedule.eod_email}
                onChange={(e) => set("eod_email", e.target.value)}
                className="max-w-xs text-sm h-8"
              />
            </div>
          )}
        </div>

        {/* Weekly */}
        <div className="border rounded-lg p-4">
          <div className="flex items-center gap-3 mb-3">
            <Switch
              checked={schedule.weekly_enabled}
              onCheckedChange={(v) => set("weekly_enabled", v)}
            />
            <div>
              <Label className="text-sm font-medium">Laporan Mingguan</Label>
              <p className="text-xs text-muted-foreground">
                Dikirim setiap minggu pukul 07:00
              </p>
            </div>
          </div>
          {schedule.weekly_enabled && (
            <div className="flex gap-3">
              <div>
                <Label className="text-xs mb-1 block text-muted-foreground">
                  Hari
                </Label>
                <Select
                  value={String(schedule.weekly_day)}
                  onValueChange={(v) => set("weekly_day", parseInt(v))}
                >
                  <SelectTrigger className="w-32 h-8 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DAYS.map((d, i) => (
                      <SelectItem key={i + 1} value={String(i + 1)}>
                        {d}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-1">
                <Label className="text-xs mb-1 block text-muted-foreground">
                  Email Tujuan
                </Label>
                <Input
                  type="email"
                  placeholder="owner@email.com"
                  value={schedule.weekly_email}
                  onChange={(e) => set("weekly_email", e.target.value)}
                  className="text-sm h-8"
                />
              </div>
            </div>
          )}
        </div>

        {/* Monthly */}
        <div className="border rounded-lg p-4">
          <div className="flex items-center gap-3 mb-3">
            <Switch
              checked={schedule.monthly_enabled}
              onCheckedChange={(v) => set("monthly_enabled", v)}
            />
            <div>
              <Label className="text-sm font-medium">Laporan Bulanan</Label>
              <p className="text-xs text-muted-foreground">
                Dikirim tanggal 1 setiap bulan pukul 07:00
              </p>
            </div>
          </div>
          {schedule.monthly_enabled && (
            <div>
              <Label className="text-xs mb-1 block text-muted-foreground">
                Email Tujuan
              </Label>
              <Input
                type="email"
                placeholder="owner@email.com"
                value={schedule.monthly_email}
                onChange={(e) => set("monthly_email", e.target.value)}
                className="max-w-xs text-sm h-8"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
