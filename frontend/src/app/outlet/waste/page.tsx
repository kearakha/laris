'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Trash2, Plus, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'
import { useAuthStore } from '@/lib/stores/authStore'
import { inventoryApi, type Ingredient } from '@/lib/api/outlet'
import apiClient from '@/lib/api/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { formatRupiah } from '@/lib/utils'

interface WasteByIngredient {
  ingredient_id: number
  ingredient_name: string
  unit: string
  total_quantity: number
  total_cost: number
  entries: number
}

interface WasteEntry {
  id: number
  ingredient_id: number
  quantity: number
  notes?: string
  created_at: string
  ingredient: { name: string; unit: string }
  createdBy?: { name: string }
}

interface WasteSummary {
  total_waste_cost: number
  total_entries: number
}

export default function WastePage() {
  const { user } = useAuthStore()
  const outletId = user?.outlet?.id
  const qc = useQueryClient()
  const headers = outletId ? { 'X-Outlet-Id': String(outletId) } : {}

  const today = new Date().toISOString().slice(0, 10)
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10)

  const [dateFrom, setDateFrom] = useState(monthStart)
  const [dateTo, setDateTo] = useState(today)
  const [logOpen, setLogOpen] = useState(false)
  const [form, setForm] = useState({ ingredient_id: '', quantity: '', notes: '' })

  const { data: reportData, isLoading } = useQuery({
    queryKey: ['waste-report', outletId, dateFrom, dateTo],
    queryFn: () => apiClient.get('/api/v1/outlet/inventory/waste-report', {
      headers,
      params: { date_from: dateFrom, date_to: dateTo },
    }),
  })

  const { data: ingredientsData } = useQuery({
    queryKey: ['ingredients', outletId],
    queryFn: () => inventoryApi.getIngredients({}, outletId),
    enabled: logOpen,
  })

  const logMutation = useMutation({
    mutationFn: () => apiClient.post(
      `/api/v1/outlet/inventory/ingredients/${form.ingredient_id}/adjustment`,
      { type: 'waste', quantity: -Math.abs(parseFloat(form.quantity)), notes: form.notes || undefined },
      { headers }
    ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['waste-report'] })
      toast.success('Waste dicatat')
      setLogOpen(false)
      setForm({ ingredient_id: '', quantity: '', notes: '' })
    },
    onError: (e: { response?: { data?: { message?: string } } }) =>
      toast.error(e.response?.data?.message ?? 'Gagal mencatat waste'),
  })

  const byIngredient: WasteByIngredient[] = reportData?.data?.data?.by_ingredient ?? []
  const entries: WasteEntry[] = reportData?.data?.data?.entries ?? []
  const summary: WasteSummary = reportData?.data?.data?.summary ?? { total_waste_cost: 0, total_entries: 0 }
  const ingredients: Ingredient[] = ingredientsData?.data?.data?.data ?? []

  const canSubmit = form.ingredient_id && parseFloat(form.quantity) > 0

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Waste & Spoilage</h1>
          <p className="text-muted-foreground text-sm">Catat dan pantau pemborosan bahan baku</p>
        </div>
        <Button onClick={() => setLogOpen(true)}>
          <Plus className="h-4 w-4 mr-1" /> Catat Waste
        </Button>
      </div>

      {/* Date filter */}
      <div className="flex gap-3 items-end mb-6">
        <div>
          <Label className="text-xs mb-1 block text-muted-foreground">Dari</Label>
          <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="w-36 text-sm h-8" />
        </div>
        <div>
          <Label className="text-xs mb-1 block text-muted-foreground">Sampai</Label>
          <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="w-36 text-sm h-8" />
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="border rounded-lg p-4 bg-red-50 border-red-200">
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle className="h-4 w-4 text-red-500" />
            <span className="text-xs font-medium text-red-700">Total Kerugian Waste</span>
          </div>
          <p className="text-2xl font-bold text-red-700">{formatRupiah(summary.total_waste_cost)}</p>
        </div>
        <div className="border rounded-lg p-4">
          <div className="flex items-center gap-2 mb-1">
            <Trash2 className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs font-medium text-muted-foreground">Total Entri</span>
          </div>
          <p className="text-2xl font-bold">{summary.total_entries}</p>
        </div>
      </div>

      {isLoading ? (
        <div className="text-sm text-muted-foreground">Memuat...</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* By ingredient */}
          <div>
            <h2 className="text-sm font-semibold mb-3">Per Bahan Baku</h2>
            {byIngredient.length === 0 ? (
              <p className="text-sm text-muted-foreground">Tidak ada waste pada periode ini.</p>
            ) : (
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="text-left p-3 font-medium">Bahan</th>
                      <th className="text-right p-3 font-medium">Qty</th>
                      <th className="text-right p-3 font-medium">Kerugian</th>
                    </tr>
                  </thead>
                  <tbody>
                    {byIngredient.map(row => (
                      <tr key={row.ingredient_id} className="border-t hover:bg-muted/20">
                        <td className="p-3">
                          <p className="font-medium">{row.ingredient_name}</p>
                          <p className="text-xs text-muted-foreground">{row.entries}x entri</p>
                        </td>
                        <td className="p-3 text-right">
                          {row.total_quantity} {row.unit}
                        </td>
                        <td className="p-3 text-right font-semibold text-red-600">
                          {formatRupiah(row.total_cost)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Recent entries */}
          <div>
            <h2 className="text-sm font-semibold mb-3">Entri Terbaru</h2>
            {entries.length === 0 ? (
              <p className="text-sm text-muted-foreground">Tidak ada entri.</p>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {entries.map(e => (
                  <div key={e.id} className="border rounded-lg p-3 flex gap-3 items-start">
                    <div className="h-8 w-8 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                      <Trash2 className="h-3.5 w-3.5 text-red-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{e.ingredient?.name ?? '-'}</p>
                      {e.notes && <p className="text-xs text-muted-foreground truncate">{e.notes}</p>}
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {Math.abs(e.quantity)} {e.ingredient?.unit} ·{' '}
                        {new Date(e.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        {e.createdBy && ` · ${e.createdBy.name}`}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Log waste dialog */}
      <Dialog open={logOpen} onOpenChange={setLogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Catat Waste / Spoilage</DialogTitle></DialogHeader>
          <div className="space-y-4">
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
              <Label className="text-sm mb-1.5 block">Jumlah Terbuang</Label>
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
              <Label className="text-sm mb-1.5 block">Alasan / Keterangan</Label>
              <Input
                placeholder="Kadaluarsa, rusak, salah masak..."
                value={form.notes}
                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              />
            </div>
            <Button
              className="w-full"
              variant="destructive"
              disabled={!canSubmit || logMutation.isPending}
              onClick={() => logMutation.mutate()}
            >
              {logMutation.isPending ? 'Menyimpan...' : 'Catat Waste'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
