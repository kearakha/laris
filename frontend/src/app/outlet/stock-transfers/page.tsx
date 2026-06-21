'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, ArrowRight, CheckCircle, XCircle } from 'lucide-react'
import { toast } from 'sonner'
import { useAuthStore } from '@/lib/stores/authStore'
import { inventoryApi, type Ingredient } from '@/lib/api/outlet'
import apiClient from '@/lib/api/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/lib/utils'

interface Outlet {
  id: number
  name: string
  is_central_kitchen: boolean
}

interface StockTransfer {
  id: number
  from_outlet: Outlet
  to_outlet: Outlet
  ingredient: Ingredient
  quantity: number
  status: 'pending' | 'approved' | 'rejected'
  notes?: string
  requested_by: { name: string }
  approved_by?: { name: string }
  created_at: string
}

const STATUS_CONFIG = {
  pending: { label: 'Menunggu', color: 'bg-amber-100 text-amber-700 border-amber-200' },
  approved: { label: 'Disetujui', color: 'bg-green-100 text-green-700 border-green-200' },
  rejected: { label: 'Ditolak', color: 'bg-red-100 text-red-700 border-red-200' },
}

export default function StockTransfersPage() {
  const { user } = useAuthStore()
  const outletId = user?.outlet?.id
  const qc = useQueryClient()
  const headers = outletId ? { 'X-Outlet-Id': String(outletId) } : {}

  const [createOpen, setCreateOpen] = useState(false)
  const [form, setForm] = useState({ to_outlet_id: '', ingredient_id: '', quantity: '', notes: '' })

  const { data: transfersData, isLoading } = useQuery({
    queryKey: ['stock-transfers', outletId],
    queryFn: () => apiClient.get('/api/v1/outlet/stock-transfers', { headers }),
  })

  const { data: outletsData } = useQuery({
    queryKey: ['outlets-list'],
    queryFn: () => apiClient.get('/api/v1/outlet/stock-transfers/outlets', { headers }),
    enabled: createOpen,
  })

  const { data: ingredientsData } = useQuery({
    queryKey: ['ingredients', outletId],
    queryFn: () => inventoryApi.getIngredients({}, outletId),
    enabled: createOpen,
  })

  const createMutation = useMutation({
    mutationFn: () => apiClient.post('/api/v1/outlet/stock-transfers', {
      to_outlet_id: parseInt(form.to_outlet_id),
      ingredient_id: parseInt(form.ingredient_id),
      quantity: parseFloat(form.quantity),
      notes: form.notes || undefined,
    }, { headers }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['stock-transfers'] })
      toast.success('Permintaan transfer dibuat')
      setCreateOpen(false)
      setForm({ to_outlet_id: '', ingredient_id: '', quantity: '', notes: '' })
    },
    onError: (e: { response?: { data?: { message?: string } } }) =>
      toast.error(e.response?.data?.message ?? 'Gagal membuat transfer'),
  })

  const approveMutation = useMutation({
    mutationFn: (id: number) => apiClient.patch(`/api/v1/outlet/stock-transfers/${id}/approve`, {}, { headers }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['stock-transfers'] })
      toast.success('Transfer disetujui')
    },
    onError: () => toast.error('Gagal menyetujui transfer'),
  })

  const rejectMutation = useMutation({
    mutationFn: (id: number) => apiClient.patch(`/api/v1/outlet/stock-transfers/${id}/reject`, {}, { headers }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['stock-transfers'] })
      toast.success('Transfer ditolak')
    },
    onError: () => toast.error('Gagal menolak transfer'),
  })

  const transfers: StockTransfer[] = transfersData?.data?.data ?? []
  const outlets: Outlet[] = outletsData?.data?.data ?? []
  const ingredients: Ingredient[] = ingredientsData?.data?.data?.data ?? []

  const isCentral = user?.outlet?.is_central_kitchen

  const canSubmit = form.to_outlet_id && form.ingredient_id && parseFloat(form.quantity) > 0

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Transfer Stok</h1>
          <p className="text-muted-foreground text-sm">
            {isCentral ? 'Kirim bahan baku ke outlet' : 'Minta bahan baku dari dapur pusat'}
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4 mr-1" />
          {isCentral ? 'Kirim Stok' : 'Minta Stok'}
        </Button>
      </div>

      {isLoading ? (
        <div className="text-sm text-muted-foreground">Memuat...</div>
      ) : transfers.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <ArrowRight className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>Belum ada transfer stok.</p>
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left p-3 font-medium">Bahan</th>
                <th className="text-left p-3 font-medium">Dari</th>
                <th className="text-left p-3 font-medium">Ke</th>
                <th className="text-right p-3 font-medium">Jumlah</th>
                <th className="text-left p-3 font-medium">Status</th>
                <th className="text-left p-3 font-medium">Tanggal</th>
                <th className="p-3" />
              </tr>
            </thead>
            <tbody>
              {transfers.map(t => {
                const cfg = STATUS_CONFIG[t.status]
                const isFromMe = t.from_outlet.id === outletId
                const canApprove = isFromMe && t.status === 'pending'
                return (
                  <tr key={t.id} className="border-t hover:bg-muted/20">
                    <td className="p-3 font-medium">
                      {t.ingredient.name}
                      <span className="text-muted-foreground ml-1 text-xs">({t.ingredient.unit})</span>
                    </td>
                    <td className="p-3 text-sm">
                      <span className={cn('text-xs', t.from_outlet.is_central_kitchen && 'font-semibold text-primary')}>
                        {t.from_outlet.name}
                        {t.from_outlet.is_central_kitchen && ' ★'}
                      </span>
                    </td>
                    <td className="p-3 text-sm">{t.to_outlet.name}</td>
                    <td className="p-3 text-right font-semibold">{t.quantity}</td>
                    <td className="p-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${cfg.color}`}>
                        {cfg.label}
                      </span>
                    </td>
                    <td className="p-3 text-xs text-muted-foreground">
                      {new Date(t.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                    </td>
                    <td className="p-3">
                      {canApprove && (
                        <div className="flex gap-1">
                          <button
                            onClick={() => approveMutation.mutate(t.id)}
                            disabled={approveMutation.isPending}
                            className="text-green-600 hover:text-green-700"
                            title="Setujui"
                          >
                            <CheckCircle className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => rejectMutation.mutate(t.id)}
                            disabled={rejectMutation.isPending}
                            className="text-destructive hover:text-destructive/70"
                            title="Tolak"
                          >
                            <XCircle className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{isCentral ? 'Kirim Stok ke Outlet' : 'Minta Stok dari Dapur Pusat'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-sm mb-1.5 block">
                {isCentral ? 'Outlet Tujuan' : 'Dapur / Gudang Sumber'}
              </Label>
              <Select value={form.to_outlet_id} onValueChange={v => setForm(f => ({ ...f, to_outlet_id: v }))}>
                <SelectTrigger><SelectValue placeholder="Pilih outlet..." /></SelectTrigger>
                <SelectContent>
                  {outlets.filter(o => o.id !== outletId).map(o => (
                    <SelectItem key={o.id} value={String(o.id)}>
                      {o.name}{o.is_central_kitchen ? ' (Dapur Pusat)' : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-sm mb-1.5 block">Bahan Baku</Label>
              <Select value={form.ingredient_id} onValueChange={v => setForm(f => ({ ...f, ingredient_id: v }))}>
                <SelectTrigger><SelectValue placeholder="Pilih bahan..." /></SelectTrigger>
                <SelectContent>
                  {ingredients.map(i => (
                    <SelectItem key={i.id} value={String(i.id)}>
                      {i.name} ({i.unit}) — stok: {i.current_stock}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-sm mb-1.5 block">Jumlah</Label>
              <Input
                type="number"
                step="0.001"
                min="0"
                placeholder="0.000"
                value={form.quantity}
                onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))}
              />
            </div>
            <div>
              <Label className="text-sm mb-1.5 block">Catatan (opsional)</Label>
              <Input
                placeholder="Catatan transfer..."
                value={form.notes}
                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              />
            </div>
            <Button
              className="w-full"
              disabled={!canSubmit || createMutation.isPending}
              onClick={() => createMutation.mutate()}
            >
              {createMutation.isPending ? 'Menyimpan...' : 'Buat Permintaan'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
