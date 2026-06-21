'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Copy, Check, Plug, PlugZap } from 'lucide-react'
import { toast } from 'sonner'
import { useAuthStore } from '@/lib/stores/authStore'
import apiClient from '@/lib/api/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { cn } from '@/lib/utils'

interface PlatformConfig {
  platform: string
  label: string
  is_active: boolean
  outlet_token: string | null
  last_synced_at: string | null
  configured: boolean
}

interface UpsertForm {
  api_key: string
  webhook_secret: string
  is_active: boolean
}

const PLATFORM_COLORS: Record<string, string> = {
  gofood:     'bg-red-50 border-red-200',
  grabfood:   'bg-green-50 border-green-200',
  shopeefood: 'bg-orange-50 border-orange-200',
}

const PLATFORM_ICONS: Record<string, string> = {
  gofood:     '🛵',
  grabfood:   '🟢',
  shopeefood: '🛍️',
}

export default function MarketplacePage() {
  const { user } = useAuthStore()
  const outletId = user?.outlet?.id
  const qc = useQueryClient()
  const headers = outletId ? { 'X-Outlet-Id': String(outletId) } : {}

  const [editing, setEditing] = useState<string | null>(null)
  const [forms, setForms] = useState<Record<string, UpsertForm>>({})
  const [copied, setCopied] = useState<string | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['marketplace', outletId],
    queryFn: () => apiClient.get('/api/v1/outlet/marketplace', { headers }),
  })

  const saveMutation = useMutation({
    mutationFn: ({ platform, form }: { platform: string; form: UpsertForm }) =>
      apiClient.put(`/api/v1/outlet/marketplace/${platform}`, form, { headers }),
    onSuccess: (res, { platform }) => {
      qc.invalidateQueries({ queryKey: ['marketplace'] })
      const webhookUrl = res.data?.data?.webhook_url
      toast.success(`${platform} integration disimpan`)
      if (webhookUrl) {
        toast.info(`Webhook URL: ${webhookUrl}`, { duration: 8000 })
      }
      setEditing(null)
    },
    onError: () => toast.error('Gagal menyimpan'),
  })

  const platforms: PlatformConfig[] = data?.data?.data ?? []

  const getForm = (platform: string): UpsertForm =>
    forms[platform] ?? { api_key: '', webhook_secret: '', is_active: false }

  const setForm = (platform: string, patch: Partial<UpsertForm>) =>
    setForms(f => ({ ...f, [platform]: { ...getForm(platform), ...patch } }))

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text)
    setCopied(key)
    setTimeout(() => setCopied(null), 2000)
    toast.success('Disalin ke clipboard')
  }

  if (isLoading) return <div className="p-6 text-sm text-muted-foreground">Memuat...</div>

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Integrasi Marketplace</h1>
        <p className="text-muted-foreground text-sm">
          Terima order dari GoFood, GrabFood & ShopeeFood langsung ke sistem — tanpa input manual
        </p>
      </div>

      <div className="space-y-4">
        {platforms.map(p => (
          <div key={p.platform} className={cn('border rounded-xl p-5', PLATFORM_COLORS[p.platform] ?? 'bg-muted/20')}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{PLATFORM_ICONS[p.platform]}</span>
                <div>
                  <p className="font-semibold">{p.label}</p>
                  <p className="text-xs text-muted-foreground">
                    {p.configured
                      ? (p.is_active ? '✅ Aktif' : '⚫ Nonaktif')
                      : 'Belum dikonfigurasi'}
                    {p.last_synced_at && (
                      <> · Terakhir sync: {new Date(p.last_synced_at).toLocaleDateString('id-ID')}</>
                    )}
                  </p>
                </div>
              </div>
              <Button
                size="sm"
                variant={editing === p.platform ? 'ghost' : 'outline'}
                onClick={() => {
                  if (editing === p.platform) {
                    setEditing(null)
                  } else {
                    setEditing(p.platform)
                    setForm(p.platform, { api_key: '', webhook_secret: '', is_active: p.is_active })
                  }
                }}
              >
                {editing === p.platform ? 'Batal' : (p.configured ? 'Edit' : 'Setup')}
              </Button>
            </div>

            {p.outlet_token && (
              <div className="mt-3 p-3 rounded-lg bg-white/60 border border-white">
                <p className="text-xs font-medium text-muted-foreground mb-1">Webhook URL (daftarkan ke platform):</p>
                <div className="flex items-center gap-2">
                  <code className="text-xs flex-1 truncate font-mono text-foreground">
                    {`/api/v1/webhooks/marketplace/${p.platform}/${p.outlet_token}`}
                  </code>
                  <button
                    onClick={() => copyToClipboard(
                      `${window.location.origin}/api/v1/webhooks/marketplace/${p.platform}/${p.outlet_token}`,
                      p.platform
                    )}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    {copied === p.platform ? <Check className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </div>
            )}

            {editing === p.platform && (
              <div className="mt-4 space-y-3 border-t pt-4">
                <div>
                  <Label className="text-xs mb-1 block">API Key (opsional)</Label>
                  <Input
                    type="password"
                    placeholder="Masukkan API key dari platform..."
                    value={getForm(p.platform).api_key}
                    onChange={e => setForm(p.platform, { api_key: e.target.value })}
                    className="text-sm h-8"
                  />
                </div>
                <div>
                  <Label className="text-xs mb-1 block">Webhook Secret (opsional)</Label>
                  <Input
                    type="password"
                    placeholder="Secret untuk verifikasi webhook..."
                    value={getForm(p.platform).webhook_secret}
                    onChange={e => setForm(p.platform, { webhook_secret: e.target.value })}
                    className="text-sm h-8"
                  />
                </div>
                <div className="flex items-center gap-3">
                  <Switch
                    checked={getForm(p.platform).is_active}
                    onCheckedChange={v => setForm(p.platform, { is_active: v })}
                  />
                  <Label className="text-sm">Aktifkan integrasi</Label>
                </div>
                <Button
                  size="sm"
                  disabled={saveMutation.isPending}
                  onClick={() => saveMutation.mutate({ platform: p.platform, form: getForm(p.platform) })}
                >
                  <PlugZap className="h-3.5 w-3.5 mr-1" />
                  {saveMutation.isPending ? 'Menyimpan...' : 'Simpan'}
                </Button>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-6 p-4 border rounded-lg bg-muted/30 text-sm text-muted-foreground">
        <p className="font-medium text-foreground mb-1">Cara setup integrasi:</p>
        <ol className="list-decimal list-inside space-y-1 text-xs">
          <li>Klik <strong>Setup</strong> pada platform yang diinginkan</li>
          <li>Isi API Key dari dashboard mitra platform (GoFood Partner / Grab Merchant / ShopeeFood Partner)</li>
          <li>Aktifkan integrasi, klik <strong>Simpan</strong></li>
          <li>Salin Webhook URL yang muncul, lalu daftarkan ke dashboard platform</li>
          <li>Order masuk otomatis akan tampil di KDS dan daftar order</li>
        </ol>
      </div>
    </div>
  )
}
