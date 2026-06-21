'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Plus, Eye, ClipboardCheck } from 'lucide-react'
import { toast } from 'sonner'
import { inventoryApi, type Supplier, type Ingredient, type PurchaseOrder } from '@/lib/api/outlet'
import { useAuthStore } from '@/lib/stores/authStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { formatRupiah } from '@/lib/utils'
import Link from 'next/link'

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-muted text-muted-foreground',
  sent: 'bg-blue-100 text-blue-700',
  partial: 'bg-amber-100 text-amber-700',
  received: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
}

interface POItem { ingredient_id: string; quantity_ordered: string; unit_price: string }

export default function PurchaseOrdersPage() {
  const { user } = useAuthStore()
  const outletId = user?.outlet?.id
  const qc = useQueryClient()

  const [showCreate, setShowCreate] = useState(false)
  const [viewPO, setViewPO] = useState<PurchaseOrder | null>(null)
  const [showReceive, setShowReceive] = useState<PurchaseOrder | null>(null)

  const [supplierId, setSupplierId] = useState('')
  const [notes, setNotes] = useState('')
  const [items, setItems] = useState<POItem[]>([{ ingredient_id: '', quantity_ordered: '', unit_price: '' }])

  const [receiveItems, setReceiveItems] = useState<Record<number, string>>({})

  const { data } = useQuery({
    queryKey: ['purchase-orders', outletId],
    queryFn: () => inventoryApi.getPurchaseOrders({}, outletId),
  })

  const { data: suppliersData } = useQuery({
    queryKey: ['suppliers', outletId],
    queryFn: () => inventoryApi.getSuppliers(outletId),
  })

  const { data: ingredientsData } = useQuery({
    queryKey: ['ingredients', outletId],
    queryFn: () => inventoryApi.getIngredients({}, outletId),
  })

  const createMutation = useMutation({
    mutationFn: () => inventoryApi.createPurchaseOrder({
      supplier_id: parseInt(supplierId),
      notes: notes || undefined,
      items: items.filter(i => i.ingredient_id).map(i => ({
        ingredient_id: parseInt(i.ingredient_id),
        quantity_ordered: parseFloat(i.quantity_ordered),
        unit_price: parseFloat(i.unit_price),
      })),
    }, outletId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['purchase-orders'] })
      toast.success('Purchase order dibuat')
      setShowCreate(false)
      setSupplierId('')
      setNotes('')
      setItems([{ ingredient_id: '', quantity_ordered: '', unit_price: '' }])
    },
    onError: () => toast.error('Gagal membuat PO'),
  })

  const receiveMutation = useMutation({
    mutationFn: (po: PurchaseOrder) => inventoryApi.receivePurchaseOrder(
      po.id,
      Object.entries(receiveItems).map(([ingredient_id, qty]) => ({
        ingredient_id: parseInt(ingredient_id),
        quantity_received: parseFloat(qty) || 0,
      })),
      outletId
    ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['purchase-orders'] })
      qc.invalidateQueries({ queryKey: ['ingredients'] })
      toast.success('Barang diterima, stok diupdate')
      setShowReceive(null)
      setReceiveItems({})
    },
    onError: () => toast.error('Gagal menerima barang'),
  })

  const pos: PurchaseOrder[] = data?.data?.data?.data ?? []
  const suppliers: Supplier[] = suppliersData?.data?.data ?? []
  const ingredients: Ingredient[] = ingredientsData?.data?.data?.data ?? []

  const totalPO = items.reduce((s, i) => s + (parseFloat(i.quantity_ordered) || 0) * (parseFloat(i.unit_price) || 0), 0)

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/outlet/inventory"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">Purchase Order</h1>
          <p className="text-muted-foreground text-sm">Pemesanan bahan baku ke supplier</p>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <Plus className="h-4 w-4 mr-1" /> Buat PO
        </Button>
      </div>

      {pos.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <ClipboardCheck className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>Belum ada purchase order</p>
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left p-3 font-medium">No. PO</th>
                <th className="text-left p-3 font-medium">Supplier</th>
                <th className="text-left p-3 font-medium">Status</th>
                <th className="text-right p-3 font-medium">Total</th>
                <th className="text-left p-3 font-medium">Tanggal</th>
                <th className="text-right p-3 font-medium">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {pos.map(po => (
                <tr key={po.id} className="border-t hover:bg-muted/20">
                  <td className="p-3 font-mono text-xs font-medium">{po.po_number}</td>
                  <td className="p-3">{po.supplier?.name ?? '-'}</td>
                  <td className="p-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[po.status] ?? ''}`}>
                      {po.status}
                    </span>
                  </td>
                  <td className="p-3 text-right font-semibold">{formatRupiah(po.total_amount)}</td>
                  <td className="p-3 text-muted-foreground text-xs">
                    {new Date(po.ordered_at ?? '').toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </td>
                  <td className="p-3">
                    <div className="flex gap-1 justify-end">
                      {['draft', 'sent', 'partial'].includes(po.status) && (
                        <Button size="sm" variant="outline" onClick={() => {
                          setShowReceive(po)
                          const init: Record<number, string> = {}
                          po.items?.forEach(i => { init[i.ingredient_id] = '' })
                          setReceiveItems(init)
                        }}>
                          <ClipboardCheck className="h-3.5 w-3.5 mr-1" /> Terima
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create PO Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Buat Purchase Order</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Supplier</Label>
              <Select value={supplierId} onValueChange={setSupplierId}>
                <SelectTrigger><SelectValue placeholder="Pilih supplier..." /></SelectTrigger>
                <SelectContent>
                  {suppliers.map(s => <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <Label>Item</Label>
                <Button variant="ghost" size="sm" onClick={() => setItems(p => [...p, { ingredient_id: '', quantity_ordered: '', unit_price: '' }])}>
                  <Plus className="h-3.5 w-3.5" />
                </Button>
              </div>
              <div className="space-y-2">
                {items.map((item, i) => (
                  <div key={i} className="grid grid-cols-12 gap-2 items-center">
                    <div className="col-span-5">
                      <Select value={item.ingredient_id} onValueChange={v => setItems(p => p.map((x, j) => j === i ? { ...x, ingredient_id: v } : x))}>
                        <SelectTrigger className="text-xs"><SelectValue placeholder="Bahan..." /></SelectTrigger>
                        <SelectContent>
                          {ingredients.map(ing => <SelectItem key={ing.id} value={String(ing.id)}>{ing.name} ({ing.unit})</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="col-span-3">
                      <Input className="text-xs" type="number" placeholder="Qty" value={item.quantity_ordered}
                        onChange={e => setItems(p => p.map((x, j) => j === i ? { ...x, quantity_ordered: e.target.value } : x))} />
                    </div>
                    <div className="col-span-3">
                      <Input className="text-xs" type="number" placeholder="Harga/unit" value={item.unit_price}
                        onChange={e => setItems(p => p.map((x, j) => j === i ? { ...x, unit_price: e.target.value } : x))} />
                    </div>
                    <div className="col-span-1">
                      {items.length > 1 && (
                        <button onClick={() => setItems(p => p.filter((_, j) => j !== i))} className="text-destructive text-xs">✕</button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <Label>Catatan</Label>
              <Input value={notes} onChange={e => setNotes(e.target.value)} placeholder="Catatan pemesanan..." />
            </div>

            <div className="flex justify-between items-center font-semibold text-sm border-t pt-3">
              <span>Total</span>
              <span>{formatRupiah(totalPO)}</span>
            </div>

            <Button
              className="w-full"
              disabled={createMutation.isPending || !supplierId || items.every(i => !i.ingredient_id)}
              onClick={() => createMutation.mutate()}
            >
              Buat Purchase Order
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Receive Dialog */}
      <Dialog open={!!showReceive} onOpenChange={() => setShowReceive(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Terima Barang — {showReceive?.po_number}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {showReceive?.items?.map(item => (
              <div key={item.ingredient_id} className="flex items-center gap-3">
                <div className="flex-1 text-sm">
                  <p className="font-medium">{item.ingredient?.name}</p>
                  <p className="text-xs text-muted-foreground">Dipesan: {parseFloat(item.quantity_ordered).toLocaleString('id-ID')}</p>
                </div>
                <Input
                  type="number"
                  className="w-28 text-sm"
                  placeholder="Terima"
                  value={receiveItems[item.ingredient_id] ?? ''}
                  onChange={e => setReceiveItems(p => ({ ...p, [item.ingredient_id]: e.target.value }))}
                />
              </div>
            ))}
            <Button
              className="w-full"
              disabled={receiveMutation.isPending}
              onClick={() => showReceive && receiveMutation.mutate(showReceive)}
            >
              Konfirmasi Penerimaan
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
