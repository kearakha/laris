'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Send, Users, MessageSquare, CheckCircle2, Clock } from 'lucide-react'
import { toast } from 'sonner'
import { useAuthStore } from '@/lib/stores/authStore'
import apiClient from '@/lib/api/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/lib/utils'

interface Campaign {
  id: number
  name: string
  segment: string
  channel: string
  message: string
  status: 'draft' | 'sending' | 'sent' | 'failed'
  target_count: number
  sent_count: number
  failed_count: number
  sent_at: string | null
  created_by: { name: string }
  created_at: string
}

interface SegmentPreview {
  segment: string
  segments: Record<string, string>
  count: number
  customers: Array<{ id: number; name: string; phone: string; loyalty_tier: string }>
}

const STATUS_CONFIG = {
  draft:   { label: 'Draft', color: 'bg-muted text-muted-foreground border-border' },
  sending: { label: 'Mengirim...', color: 'bg-blue-100 text-blue-700 border-blue-200' },
  sent:    { label: 'Terkirim', color: 'bg-green-100 text-green-700 border-green-200' },
  failed:  { label: 'Gagal', color: 'bg-red-100 text-red-700 border-red-200' },
}

const TEMPLATE_PLACEHOLDERS = [
  { label: '{{name}}', desc: 'Nama customer' },
  { label: '{{points}}', desc: 'Poin loyalty' },
]

export default function CampaignsPage() {
  const { user } = useAuthStore()
  const outletId = user?.outlet?.id
  const qc = useQueryClient()
  const headers = outletId ? { 'X-Outlet-Id': String(outletId) } : {}

  const [createOpen, setCreateOpen] = useState(false)
  const [selectedSegment, setSelectedSegment] = useState('all')
  const [form, setForm] = useState({ name: '', segment: 'all', channel: 'whatsapp', message: '' })
  const [sendConfirm, setSendConfirm] = useState<Campaign | null>(null)

  const { data: campaignsData, isLoading } = useQuery({
    queryKey: ['campaigns', outletId],
    queryFn: () => apiClient.get('/api/v1/outlet/campaigns', { headers }),
  })

  const { data: previewData, isFetching: previewLoading } = useQuery({
    queryKey: ['segment-preview', outletId, selectedSegment],
    queryFn: () => apiClient.get('/api/v1/outlet/campaigns/segments', {
      headers,
      params: { segment: selectedSegment },
    }),
  })

  const createMutation = useMutation({
    mutationFn: () => apiClient.post('/api/v1/outlet/campaigns', form, { headers }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['campaigns'] })
      toast.success('Campaign dibuat')
      setCreateOpen(false)
      setForm({ name: '', segment: 'all', channel: 'whatsapp', message: '' })
    },
    onError: (e: { response?: { data?: { message?: string } } }) =>
      toast.error(e.response?.data?.message ?? 'Gagal membuat campaign'),
  })

  const sendMutation = useMutation({
    mutationFn: (campaign: Campaign) =>
      apiClient.post(`/api/v1/outlet/campaigns/${campaign.id}/send`, {}, { headers }),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['campaigns'] })
      const d = res.data?.data
      toast.success(`Terkirim: ${d?.sent} · Gagal: ${d?.failed}`)
      setSendConfirm(null)
    },
    onError: (e: { response?: { data?: { message?: string } } }) => {
      toast.error(e.response?.data?.message ?? 'Gagal mengirim')
      setSendConfirm(null)
    },
  })

  const campaigns: Campaign[] = campaignsData?.data?.data?.data ?? []
  const preview: SegmentPreview | null = previewData?.data?.data ?? null
  const segments: Record<string, string> = preview?.segments ?? {}

  const canCreate = form.name && form.segment && form.message

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Kampanye & Segmentasi</h1>
          <p className="text-muted-foreground text-sm">Kirim pesan targeted ke segment customer via WhatsApp</p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4 mr-1" /> Buat Kampanye
        </Button>
      </div>

      {/* Segment explorer */}
      <div className="border rounded-xl p-4 mb-6 bg-muted/20">
        <h2 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <Users className="h-4 w-4" /> Eksplorasi Segmen
        </h2>
        <div className="flex gap-2 flex-wrap mb-3">
          {Object.entries(segments).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setSelectedSegment(key)}
              className={cn(
                'px-3 py-1 text-xs rounded-full border font-medium transition-colors',
                selectedSegment === key ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-muted-foreground hover:bg-muted'
              )}
            >
              {label}
            </button>
          ))}
        </div>
        {previewLoading ? (
          <p className="text-xs text-muted-foreground">Memuat...</p>
        ) : preview ? (
          <div>
            <p className="text-sm font-semibold mb-2">
              <span className="text-2xl mr-1">{preview.count}</span>
              <span className="text-muted-foreground text-xs">customer dalam segment ini</span>
            </p>
            {preview.customers.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {preview.customers.slice(0, 8).map(c => (
                  <span key={c.id} className="text-xs px-2 py-0.5 rounded-full bg-white border">
                    {c.name}
                    {c.loyalty_tier !== 'bronze' && (
                      <span className="ml-1 opacity-60">{c.loyalty_tier}</span>
                    )}
                  </span>
                ))}
                {preview.count > 8 && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                    +{preview.count - 8} lainnya
                  </span>
                )}
              </div>
            )}
          </div>
        ) : null}
      </div>

      {/* Campaign list */}
      {isLoading ? (
        <div className="text-sm text-muted-foreground">Memuat...</div>
      ) : campaigns.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <MessageSquare className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p>Belum ada kampanye.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {campaigns.map(c => {
            const cfg = STATUS_CONFIG[c.status]
            return (
              <div key={c.id} className="border rounded-lg p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold text-sm truncate">{c.name}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${cfg.color}`}>
                        {cfg.label}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Segment: <span className="font-medium">{segments[c.segment] ?? c.segment}</span>
                      {' · '}Target: {c.target_count} customer
                      {c.status === 'sent' && ` · ✅ ${c.sent_count} terkirim · ❌ ${c.failed_count} gagal`}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-1 italic">"{c.message}"</p>
                  </div>
                  {c.status === 'draft' && (
                    <Button size="sm" onClick={() => setSendConfirm(c)}>
                      <Send className="h-3.5 w-3.5 mr-1" /> Kirim
                    </Button>
                  )}
                  {c.status === 'sent' && (
                    <div className="text-xs text-muted-foreground text-right shrink-0">
                      <CheckCircle2 className="h-4 w-4 text-green-600 mx-auto mb-0.5" />
                      {c.sent_at ? new Date(c.sent_at).toLocaleDateString('id-ID') : '-'}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Create dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Buat Kampanye Baru</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-sm mb-1.5 block">Nama Kampanye</Label>
              <Input
                placeholder="Contoh: Promo Ramadan, Ulang Tahun Mei"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              />
            </div>
            <div>
              <Label className="text-sm mb-1.5 block">Segment Target</Label>
              <Select value={form.segment} onValueChange={v => setForm(f => ({ ...f, segment: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(segments).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-sm mb-1.5 block">Pesan</Label>
              <Textarea
                placeholder="Halo {{name}}, kami punya promo spesial untuk kamu! 🎉"
                rows={4}
                value={form.message}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setForm(f => ({ ...f, message: e.target.value }))}
              />
              <div className="flex gap-2 mt-1.5">
                {TEMPLATE_PLACEHOLDERS.map(p => (
                  <button
                    key={p.label}
                    onClick={() => setForm(f => ({ ...f, message: f.message + p.label }))}
                    className="text-xs px-2 py-0.5 rounded border bg-muted hover:bg-muted/70 font-mono"
                    title={p.desc}
                  >
                    {p.label}
                  </button>
                ))}
                <span className="text-xs text-muted-foreground self-center">— variabel dinamis</span>
              </div>
            </div>
            <Button
              className="w-full"
              disabled={!canCreate || createMutation.isPending}
              onClick={() => createMutation.mutate()}
            >
              {createMutation.isPending ? 'Menyimpan...' : 'Buat Campaign'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Send confirm dialog */}
      <Dialog open={!!sendConfirm} onOpenChange={() => setSendConfirm(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Konfirmasi Kirim Campaign</DialogTitle></DialogHeader>
          {sendConfirm && (
            <div className="space-y-3">
              <p className="text-sm">
                Kirim <strong>"{sendConfirm.name}"</strong> ke{' '}
                <strong>{sendConfirm.target_count} customer</strong> via WhatsApp?
              </p>
              <p className="text-xs text-muted-foreground">
                Pesan akan dikirim satu per satu. Proses mungkin memakan beberapa menit.
              </p>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => setSendConfirm(null)}>
                  Batal
                </Button>
                <Button
                  className="flex-1"
                  disabled={sendMutation.isPending}
                  onClick={() => sendMutation.mutate(sendConfirm)}
                >
                  <Send className="h-3.5 w-3.5 mr-1" />
                  {sendMutation.isPending ? 'Mengirim...' : 'Kirim Sekarang'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
