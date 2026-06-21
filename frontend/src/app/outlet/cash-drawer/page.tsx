'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Wallet, TrendingUp, TrendingDown, Minus, CheckCircle, Clock } from 'lucide-react'
import { toast } from 'sonner'
import { useAuthStore } from '@/lib/stores/authStore'
import { formatRupiah } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import apiClient from '@/lib/api/client'

interface CashDrawer {
  id: number
  opening_cash: string
  closing_cash: string | null
  expected_cash: string | null
  cash_difference: string | null
  opened_at: string
  closed_at: string | null
  status: 'open' | 'closed'
  notes: string | null
  opened_by: { name: string }
  closed_by?: { name: string } | null
}

export default function CashDrawerPage() {
  const { user } = useAuthStore()
  const outletId = user?.outlet?.id
  const qc = useQueryClient()
  const headers = outletId ? { 'X-Outlet-Id': String(outletId) } : {}

  const [showOpen, setShowOpen] = useState(false)
  const [showClose, setShowClose] = useState(false)
  const [openingCash, setOpeningCash] = useState('')
  const [closingCash, setClosingCash] = useState('')
  const [notes, setNotes] = useState('')

  const { data: currentData, isLoading } = useQuery({
    queryKey: ['cash-drawer-current', outletId],
    queryFn: () => apiClient.get('/api/v1/outlet/cash-drawer/current', { headers }),
  })

  const { data: historyData } = useQuery({
    queryKey: ['cash-drawer-history', outletId],
    queryFn: () => apiClient.get('/api/v1/outlet/cash-drawer/history', { headers }),
  })

  const openMutation = useMutation({
    mutationFn: () => apiClient.post('/api/v1/outlet/cash-drawer/open', {
      opening_cash: parseFloat(openingCash),
      notes: notes || undefined,
    }, { headers }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cash-drawer-current'] })
      qc.invalidateQueries({ queryKey: ['cash-drawer-history'] })
      toast.success('Shift dibuka')
      setShowOpen(false)
      setOpeningCash('')
      setNotes('')
    },
    onError: (e: { response?: { data?: { message?: string } } }) =>
      toast.error(e.response?.data?.message ?? 'Gagal membuka shift'),
  })

  const closeMutation = useMutation({
    mutationFn: () => apiClient.post(`/api/v1/outlet/cash-drawer/${current?.id}/close`, {
      closing_cash: parseFloat(closingCash),
      notes: notes || undefined,
    }, { headers }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cash-drawer-current'] })
      qc.invalidateQueries({ queryKey: ['cash-drawer-history'] })
      toast.success('Shift ditutup')
      setShowClose(false)
      setClosingCash('')
      setNotes('')
    },
    onError: (e: { response?: { data?: { message?: string } } }) =>
      toast.error(e.response?.data?.message ?? 'Gagal menutup shift'),
  })

  const current: CashDrawer | null = currentData?.data?.data ?? null
  const history: CashDrawer[] = historyData?.data?.data ?? []

  const getDifferenceIcon = (diff: number) => {
    if (diff > 0) return <TrendingUp className="h-4 w-4 text-green-500" />
    if (diff < 0) return <TrendingDown className="h-4 w-4 text-red-500" />
    return <Minus className="h-4 w-4 text-muted-foreground" />
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Cash Drawer</h1>
          <p className="text-muted-foreground text-sm">Rekonsiliasi kas shift kasir</p>
        </div>
        {!current && (
          <Button onClick={() => setShowOpen(true)}>
            <Wallet className="h-4 w-4 mr-1" /> Buka Shift
          </Button>
        )}
      </div>

      {/* Current shift */}
      {isLoading ? (
        <div className="text-sm text-muted-foreground">Memuat...</div>
      ) : current ? (
        <div className="bg-green-50 border-2 border-green-200 rounded-xl p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="h-3 w-3 rounded-full bg-green-500 animate-pulse" />
            <span className="font-semibold text-green-800">Shift Aktif</span>
            <span className="text-xs text-green-600 ml-2">
              Dibuka {new Date(current.opened_at).toLocaleString('id-ID', { hour: '2-digit', minute: '2-digit' })} oleh {current.opened_by?.name}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="bg-white rounded-lg p-4">
              <p className="text-xs text-muted-foreground mb-1">Kas Awal</p>
              <p className="text-xl font-bold">{formatRupiah(current.opening_cash)}</p>
            </div>
            <div className="bg-white rounded-lg p-4">
              <p className="text-xs text-muted-foreground mb-1">Durasi</p>
              <p className="text-xl font-bold">
                {Math.round((Date.now() - new Date(current.opened_at).getTime()) / 3600000)} jam
              </p>
            </div>
          </div>
          <Button variant="outline" onClick={() => { setShowClose(true); setNotes('') }}>
            Tutup Shift
          </Button>
        </div>
      ) : (
        <div className="text-center py-10 text-muted-foreground border-2 border-dashed rounded-xl mb-6">
          <Wallet className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p>Tidak ada shift aktif</p>
          <p className="text-xs mt-1">Buka shift untuk mulai mencatat kas</p>
        </div>
      )}

      {/* History */}
      {history.filter(h => h.status === 'closed').length > 0 && (
        <div>
          <h2 className="font-semibold mb-3">Riwayat Shift</h2>
          <div className="space-y-3">
            {history.filter(h => h.status === 'closed').map(shift => {
              const diff = parseFloat(shift.cash_difference ?? '0')
              return (
                <div key={shift.id} className="border rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">
                        {new Date(shift.opened_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                        {' '}
                        {new Date(shift.opened_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                        {' — '}
                        {shift.closed_at ? new Date(shift.closed_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '-'}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      {getDifferenceIcon(diff)}
                      <span className={`text-sm font-semibold ${diff > 0 ? 'text-green-600' : diff < 0 ? 'text-red-600' : 'text-muted-foreground'}`}>
                        {diff > 0 ? '+' : ''}{formatRupiah(diff)}
                      </span>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div>
                      <p className="text-muted-foreground">Kas Awal</p>
                      <p className="font-medium">{formatRupiah(shift.opening_cash)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Ekspektasi</p>
                      <p className="font-medium">{formatRupiah(shift.expected_cash ?? 0)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Aktual</p>
                      <p className="font-medium">{formatRupiah(shift.closing_cash ?? 0)}</p>
                    </div>
                  </div>
                  {shift.notes && <p className="text-xs text-muted-foreground mt-2 italic">{shift.notes}</p>}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Open Shift Dialog */}
      <Dialog open={showOpen} onOpenChange={setShowOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Buka Shift</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Kas Awal (Rp)</Label>
              <Input type="number" value={openingCash} onChange={e => setOpeningCash(e.target.value)} placeholder="0" />
            </div>
            <div>
              <Label>Catatan (opsional)</Label>
              <Input value={notes} onChange={e => setNotes(e.target.value)} placeholder="Catatan shift..." />
            </div>
            <Button
              className="w-full"
              disabled={openMutation.isPending || !openingCash}
              onClick={() => openMutation.mutate()}
            >
              Buka Shift
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Close Shift Dialog */}
      <Dialog open={showClose} onOpenChange={setShowClose}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Tutup Shift</DialogTitle></DialogHeader>
          {current && (
            <div className="p-3 bg-muted/50 rounded-lg text-sm mb-2">
              <p>Kas awal: <strong>{formatRupiah(current.opening_cash)}</strong></p>
            </div>
          )}
          <div className="space-y-3">
            <div>
              <Label>Kas Aktual Saat Ini (Rp)</Label>
              <Input type="number" value={closingCash} onChange={e => setClosingCash(e.target.value)} placeholder="Hitung & masukkan kas fisik" />
            </div>
            <div>
              <Label>Catatan (opsional)</Label>
              <Input value={notes} onChange={e => setNotes(e.target.value)} placeholder="Catatan penutupan..." />
            </div>
            <Button
              className="w-full"
              disabled={closeMutation.isPending || !closingCash}
              onClick={() => closeMutation.mutate()}
            >
              Tutup Shift & Rekonsiliasi
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
