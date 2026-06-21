'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, AlertTriangle, Package, Pencil, Trash2, BarChart3 } from 'lucide-react'
import { toast } from 'sonner'
import { inventoryApi, type Ingredient } from '@/lib/api/outlet'
import { useAuthStore } from '@/lib/stores/authStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { formatRupiah } from '@/lib/utils'
import Link from 'next/link'

export default function InventoryPage() {
  const { user } = useAuthStore()
  const outletId = user?.outlet?.id
  const qc = useQueryClient()

  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Ingredient | null>(null)
  const [showAdjust, setShowAdjust] = useState<Ingredient | null>(null)
  const [filterLow, setFilterLow] = useState(false)
  const [search, setSearch] = useState('')

  const [formData, setFormData] = useState({ name: '', unit: 'kg', min_stock: '0', cost_per_unit: '0' })
  const [adjustData, setAdjustData] = useState({ type: 'adjustment', quantity: '', notes: '' })

  const { data, isLoading } = useQuery({
    queryKey: ['ingredients', outletId, filterLow, search],
    queryFn: () => inventoryApi.getIngredients(
      { ...(filterLow ? { low_stock: true } : {}), ...(search ? { search } : {}) },
      outletId
    ),
  })

  const createMutation = useMutation({
    mutationFn: (d: typeof formData) => inventoryApi.createIngredient(d, outletId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ingredients'] })
      toast.success('Bahan baku ditambahkan')
      setShowForm(false)
      setFormData({ name: '', unit: 'kg', min_stock: '0', cost_per_unit: '0' })
    },
    onError: () => toast.error('Gagal menambah bahan baku'),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Ingredient> }) =>
      inventoryApi.updateIngredient(id, data, outletId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ingredients'] })
      toast.success('Bahan baku diupdate')
      setEditing(null)
    },
    onError: () => toast.error('Gagal mengupdate'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => inventoryApi.deleteIngredient(id, outletId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ingredients'] })
      toast.success('Bahan baku dihapus')
    },
    onError: () => toast.error('Gagal menghapus'),
  })

  const adjustMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: { type: string; quantity: number; notes?: string } }) =>
      inventoryApi.adjustStock(id, data, outletId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ingredients'] })
      toast.success('Stok disesuaikan')
      setShowAdjust(null)
      setAdjustData({ type: 'adjustment', quantity: '', notes: '' })
    },
    onError: () => toast.error('Gagal menyesuaikan stok'),
  })

  const ingredients: Ingredient[] = data?.data?.data?.data ?? []
  const lowCount = ingredients.filter(i => parseFloat(i.current_stock) <= parseFloat(i.min_stock)).length

  const openEdit = (ingredient: Ingredient) => {
    setEditing(ingredient)
    setFormData({
      name: ingredient.name,
      unit: ingredient.unit,
      min_stock: ingredient.min_stock,
      cost_per_unit: ingredient.cost_per_unit,
    })
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Inventori</h1>
          <p className="text-muted-foreground text-sm">Kelola bahan baku dan stok</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/outlet/inventory/suppliers">Supplier</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/outlet/inventory/purchase-orders">Purchase Order</Link>
          </Button>
          <Button onClick={() => setShowForm(true)}>
            <Plus className="h-4 w-4 mr-1" /> Tambah Bahan
          </Button>
        </div>
      </div>

      {lowCount > 0 && (
        <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg mb-4 text-sm text-amber-800">
          <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />
          <span><strong>{lowCount} bahan baku</strong> mendekati atau di bawah stok minimum.</span>
          <button onClick={() => setFilterLow(true)} className="ml-auto text-xs underline">Lihat</button>
        </div>
      )}

      <div className="flex gap-3 mb-4">
        <Input
          placeholder="Cari bahan baku..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="max-w-xs"
        />
        <button
          onClick={() => setFilterLow(v => !v)}
          className={`px-3 py-1.5 rounded-md text-sm font-medium border transition-colors ${filterLow ? 'bg-amber-100 border-amber-300 text-amber-800' : 'border-border text-muted-foreground hover:bg-muted'}`}
        >
          {filterLow ? '✕ Stok Rendah' : 'Stok Rendah'}
        </button>
      </div>

      {isLoading ? (
        <div className="text-sm text-muted-foreground">Memuat...</div>
      ) : ingredients.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Package className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>Belum ada bahan baku</p>
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left p-3 font-medium">Nama</th>
                <th className="text-left p-3 font-medium">Satuan</th>
                <th className="text-right p-3 font-medium">Stok Saat Ini</th>
                <th className="text-right p-3 font-medium">Min Stok</th>
                <th className="text-right p-3 font-medium">Harga/Satuan</th>
                <th className="text-center p-3 font-medium">Status</th>
                <th className="text-right p-3 font-medium">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {ingredients.map(ing => {
                const isLow = parseFloat(ing.current_stock) <= parseFloat(ing.min_stock)
                return (
                  <tr key={ing.id} className="border-t hover:bg-muted/20">
                    <td className="p-3 font-medium">{ing.name}</td>
                    <td className="p-3 text-muted-foreground">{ing.unit}</td>
                    <td className={`p-3 text-right font-mono ${isLow ? 'text-red-600 font-semibold' : ''}`}>
                      {parseFloat(ing.current_stock).toLocaleString('id-ID')}
                    </td>
                    <td className="p-3 text-right text-muted-foreground font-mono">
                      {parseFloat(ing.min_stock).toLocaleString('id-ID')}
                    </td>
                    <td className="p-3 text-right text-muted-foreground">
                      {formatRupiah(ing.cost_per_unit)}
                    </td>
                    <td className="p-3 text-center">
                      {isLow ? (
                        <Badge variant="destructive" className="text-xs">Rendah</Badge>
                      ) : (
                        <Badge variant="secondary" className="text-xs">OK</Badge>
                      )}
                    </td>
                    <td className="p-3">
                      <div className="flex gap-1 justify-end">
                        <Button size="sm" variant="ghost" onClick={() => setShowAdjust(ing)} title="Sesuaikan stok">
                          <BarChart3 className="h-3.5 w-3.5" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => openEdit(ing)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-destructive"
                          onClick={() => { if (confirm('Hapus bahan ini?')) deleteMutation.mutate(ing.id) }}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={showForm || !!editing} onOpenChange={() => { setShowForm(false); setEditing(null) }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Bahan Baku' : 'Tambah Bahan Baku'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Nama</Label>
              <Input value={formData.name} onChange={e => setFormData(p => ({ ...p, name: e.target.value }))} placeholder="Nama bahan..." />
            </div>
            <div>
              <Label>Satuan</Label>
              <Select value={formData.unit} onValueChange={v => setFormData(p => ({ ...p, unit: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {['kg', 'gram', 'liter', 'ml', 'pcs', 'box'].map(u => (
                    <SelectItem key={u} value={u}>{u}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label>Stok Minimum</Label>
                <Input type="number" value={formData.min_stock} onChange={e => setFormData(p => ({ ...p, min_stock: e.target.value }))} />
              </div>
              <div>
                <Label>Harga/Satuan</Label>
                <Input type="number" value={formData.cost_per_unit} onChange={e => setFormData(p => ({ ...p, cost_per_unit: e.target.value }))} />
              </div>
            </div>
            <Button
              className="w-full"
              disabled={createMutation.isPending || updateMutation.isPending || !formData.name}
              onClick={() => {
                if (editing) {
                  updateMutation.mutate({ id: editing.id, data: formData })
                } else {
                  createMutation.mutate(formData)
                }
              }}
            >
              {editing ? 'Simpan' : 'Tambah'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Adjustment Dialog */}
      <Dialog open={!!showAdjust} onOpenChange={() => setShowAdjust(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Sesuaikan Stok — {showAdjust?.name}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Stok saat ini: <strong>{showAdjust ? parseFloat(showAdjust.current_stock).toLocaleString('id-ID') : 0} {showAdjust?.unit}</strong>
          </p>
          <div className="space-y-3">
            <div>
              <Label>Tipe</Label>
              <Select value={adjustData.type} onValueChange={v => setAdjustData(p => ({ ...p, type: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="adjustment">Penyesuaian Manual</SelectItem>
                  <SelectItem value="waste">Pemborosan/Rusak</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>
                {adjustData.type === 'adjustment' ? 'Jumlah (+ tambah / - kurangi)' : 'Jumlah Terbuang'}
              </Label>
              <Input
                type="number"
                value={adjustData.quantity}
                onChange={e => setAdjustData(p => ({ ...p, quantity: e.target.value }))}
                placeholder={adjustData.type === 'adjustment' ? '-5 atau +10' : '5'}
              />
            </div>
            <div>
              <Label>Catatan</Label>
              <Input value={adjustData.notes} onChange={e => setAdjustData(p => ({ ...p, notes: e.target.value }))} placeholder="Alasan..." />
            </div>
            <Button
              className="w-full"
              disabled={adjustMutation.isPending || !adjustData.quantity}
              onClick={() => {
                if (!showAdjust) return
                adjustMutation.mutate({
                  id: showAdjust.id,
                  data: {
                    type: adjustData.type,
                    quantity: parseFloat(adjustData.quantity),
                    notes: adjustData.notes || undefined,
                  },
                })
              }}
            >
              Simpan
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
