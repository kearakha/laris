'use client'

import { useState, useEffect } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { Save } from 'lucide-react'
import { toast } from 'sonner'
import { useAuthStore } from '@/lib/stores/authStore'
import apiClient from '@/lib/api/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'

interface OutletSettings {
  ppn_rate: number
  ppn_inclusive: boolean
  service_charge_rate: number
  receipt_header: string
  receipt_footer: string
  auto_print_receipt: boolean
  kds_enabled: boolean
  loyalty_enabled: boolean
  reservation_enabled: boolean
  whatsapp_token: string
  whatsapp_sender: string
  wa_receipt_enabled: boolean
  wa_order_notify_enabled: boolean
}

const DEFAULTS: OutletSettings = {
  ppn_rate: 11,
  ppn_inclusive: false,
  service_charge_rate: 0,
  receipt_header: '',
  receipt_footer: '',
  auto_print_receipt: false,
  kds_enabled: true,
  loyalty_enabled: true,
  reservation_enabled: true,
  whatsapp_token: '',
  whatsapp_sender: '',
  wa_receipt_enabled: false,
  wa_order_notify_enabled: false,
}

export default function SettingsPage() {
  const { user } = useAuthStore()
  const outletId = user?.outlet?.id
  const headers = outletId ? { 'X-Outlet-Id': String(outletId) } : {}

  const [form, setForm] = useState<OutletSettings>(DEFAULTS)

  const { data } = useQuery({
    queryKey: ['outlet-settings', outletId],
    queryFn: () => apiClient.get('/api/v1/outlet/settings', { headers }),
  })

  useEffect(() => {
    if (data?.data?.data) {
      setForm(s => ({ ...s, ...data.data.data }))
    }
  }, [data])

  const saveMutation = useMutation({
    mutationFn: () => apiClient.put('/api/v1/outlet/settings', form, { headers }),
    onSuccess: () => toast.success('Pengaturan disimpan'),
    onError: () => toast.error('Gagal menyimpan'),
  })

  const set = <K extends keyof OutletSettings>(key: K, value: OutletSettings[K]) =>
    setForm(f => ({ ...f, [key]: value }))

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Pengaturan Outlet</h1>
          <p className="text-muted-foreground text-sm">Konfigurasi operasional & integrasi</p>
        </div>
        <Button disabled={saveMutation.isPending} onClick={() => saveMutation.mutate()}>
          <Save className="h-4 w-4 mr-1" />
          {saveMutation.isPending ? 'Menyimpan...' : 'Simpan'}
        </Button>
      </div>

      <div className="space-y-8">
        {/* Tax & Charges */}
        <section>
          <h2 className="text-sm font-semibold mb-4 text-muted-foreground uppercase tracking-wide">Pajak & Biaya</h2>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <Label className="text-sm mb-1.5 block">PPN (%)</Label>
                <Input type="number" min={0} max={100} value={form.ppn_rate} onChange={e => set('ppn_rate', parseFloat(e.target.value))} className="w-32" />
              </div>
              <div className="flex items-center gap-3 pt-6">
                <Switch checked={form.ppn_inclusive} onCheckedChange={v => set('ppn_inclusive', v)} />
                <Label className="text-sm">PPN sudah termasuk harga</Label>
              </div>
            </div>
            <div>
              <Label className="text-sm mb-1.5 block">Service Charge (%)</Label>
              <Input type="number" min={0} max={100} value={form.service_charge_rate} onChange={e => set('service_charge_rate', parseFloat(e.target.value))} className="w-32" />
            </div>
          </div>
        </section>

        <Separator />

        {/* Receipt */}
        <section>
          <h2 className="text-sm font-semibold mb-4 text-muted-foreground uppercase tracking-wide">Struk</h2>
          <div className="space-y-4">
            <div>
              <Label className="text-sm mb-1.5 block">Header Struk</Label>
              <Input placeholder="Selamat datang di..." value={form.receipt_header} onChange={e => set('receipt_header', e.target.value)} />
            </div>
            <div>
              <Label className="text-sm mb-1.5 block">Footer Struk</Label>
              <Input placeholder="Terima kasih atas kunjungan Anda" value={form.receipt_footer} onChange={e => set('receipt_footer', e.target.value)} />
            </div>
            <div className="flex items-center gap-3">
              <Switch checked={form.auto_print_receipt} onCheckedChange={v => set('auto_print_receipt', v)} />
              <Label className="text-sm">Auto-print struk setelah pembayaran</Label>
            </div>
          </div>
        </section>

        <Separator />

        {/* Features */}
        <section>
          <h2 className="text-sm font-semibold mb-4 text-muted-foreground uppercase tracking-wide">Fitur</h2>
          <div className="space-y-3">
            {[
              { key: 'kds_enabled' as const, label: 'KDS (Kitchen Display System)' },
              { key: 'loyalty_enabled' as const, label: 'Program Loyalty' },
              { key: 'reservation_enabled' as const, label: 'Reservasi & Waitlist' },
            ].map(({ key, label }) => (
              <div key={key} className="flex items-center gap-3">
                <Switch checked={form[key] as boolean} onCheckedChange={v => set(key, v)} />
                <Label className="text-sm">{label}</Label>
              </div>
            ))}
          </div>
        </section>

        <Separator />

        {/* WhatsApp */}
        <section>
          <h2 className="text-sm font-semibold mb-1 text-muted-foreground uppercase tracking-wide">WhatsApp (Fonnte)</h2>
          <p className="text-xs text-muted-foreground mb-4">
            Daftarkan di <a href="https://fonnte.com" target="_blank" rel="noreferrer" className="text-primary underline">fonnte.com</a> untuk mendapatkan token
          </p>
          <div className="space-y-4">
            <div>
              <Label className="text-sm mb-1.5 block">Fonnte Token</Label>
              <Input
                type="password"
                placeholder="Token dari dashboard Fonnte..."
                value={form.whatsapp_token}
                onChange={e => set('whatsapp_token', e.target.value)}
              />
            </div>
            <div>
              <Label className="text-sm mb-1.5 block">Nomor Pengirim WA (opsional)</Label>
              <Input
                placeholder="628xxxxxxxxxx"
                value={form.whatsapp_sender}
                onChange={e => set('whatsapp_sender', e.target.value)}
              />
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Switch checked={form.wa_receipt_enabled} onCheckedChange={v => set('wa_receipt_enabled', v)} />
                <Label className="text-sm">Kirim struk digital via WA setelah pembayaran</Label>
              </div>
              <div className="flex items-center gap-3">
                <Switch checked={form.wa_order_notify_enabled} onCheckedChange={v => set('wa_order_notify_enabled', v)} />
                <Label className="text-sm">Notifikasi WA saat order siap</Label>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
