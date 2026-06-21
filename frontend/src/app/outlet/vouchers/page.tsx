'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Pencil, Trash2, Ticket } from 'lucide-react'
import { toast } from 'sonner'
import { voucherApi, type Voucher } from '@/lib/api/outlet'
import { useAuthStore } from '@/lib/stores/authStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { formatRupiah } from '@/lib/utils'

interface VoucherForm {
  code: string
  name: string
  type: 'percentage' | 'fixed' | 'free_item'
  value: string
  min_order_amount: string
  max_discount_amount: string
  max_uses: string
  is_active: boolean
  valid_from: string
  valid_until: string
}

const emptyForm: VoucherForm = {
  code: '',
  name: '',
  type: 'percentage',
  value: '',
  min_order_amount: '',
  max_discount_amount: '',
  max_uses: '',
  is_active: true,
  valid_from: '',
  valid_until: '',
}

export default function VouchersPage() {
  const { user } = useAuthStore()
  const outletId = user?.outlet?.id
  const qc = useQueryClient()

  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Voucher | null>(null)
  const [formData, setFormData] = useState<VoucherForm>(emptyForm)

  const { data, isLoading } = useQuery({
    queryKey: ['vouchers', outletId],
    queryFn: () => voucherApi.getVouchers(outletId),
  })

  const createMutation = useMutation({
    mutationFn: (d: VoucherForm) => voucherApi.createVoucher({
      code: d.code,
      name: d.name,
      type: d.type,
      value: d.value,
      min_order_amount: d.min_order_amount || undefined,
      max_discount_amount: d.max_discount_amount || undefined,
      max_uses: d.max_uses ? parseInt(d.max_uses) : undefined,
      is_active: d.is_active,
      valid_from: d.valid_from || undefined,
      valid_until: d.valid_until || undefined,
    }, outletId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['vouchers'] })
      toast.success('Voucher dibuat')
      setShowForm(false)
      setFormData(emptyForm)
    },
    onError: () => toast.error('Gagal membuat voucher'),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Voucher> }) =>
      voucherApi.updateVoucher(id, data, outletId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['vouchers'] })
      toast.success('Voucher diupdate')
      setEditing(null)
    },
    onError: () => toast.error('Gagal mengupdate'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => voucherApi.deleteVoucher(id, outletId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['vouchers'] })
      toast.success('Voucher dihapus')
    },
    onError: () => toast.error('Gagal menghapus'),
  })

  const vouchers: Voucher[] = data?.data?.data?.data ?? []

  const openEdit = (v: Voucher) => {
    setEditing(v)
    setFormData({
      code: v.code,
      name: v.name,
      type: v.type,
      value: v.value,
      min_order_amount: v.min_order_amount ?? '',
      max_discount_amount: v.max_discount_amount ?? '',
      max_uses: v.max_uses ? String(v.max_uses) : '',
      is_active: v.is_active,
      valid_from: v.valid_from ? v.valid_from.substring(0, 16) : '',
      valid_until: v.valid_until ? v.valid_until.substring(0, 16) : '',
    })
  }

  const handleSubmit = () => {
    if (editing) {
      updateMutation.mutate({
        id: editing.id,
        data: {
          name: formData.name,
          type: formData.type,
          value: formData.value,
          min_order_amount: formData.min_order_amount || undefined,
          max_discount_amount: formData.max_discount_amount || undefined,
          max_uses: formData.max_uses ? parseInt(formData.max_uses) : undefined,
          is_active: formData.is_active,
          valid_from: formData.valid_from || undefined,
          valid_until: formData.valid_until || undefined,
        },
      })
    } else {
      createMutation.mutate(formData)
    }
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Voucher & Promo</h1>
          <p className="text-muted-foreground text-sm">Kelola kode voucher diskon</p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4 mr-1" /> Buat Voucher
        </Button>
      </div>

      {isLoading ? (
        <div className="text-sm text-muted-foreground">Memuat...</div>
      ) : vouchers.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Ticket className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>Belum ada voucher</p>
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left p-3 font-medium">Kode</th>
                <th className="text-left p-3 font-medium">Nama</th>
                <th className="text-left p-3 font-medium">Tipe</th>
                <th className="text-right p-3 font-medium">Nilai</th>
                <th className="text-right p-3 font-medium">Terpakai</th>
                <th className="text-center p-3 font-medium">Status</th>
                <th className="text-right p-3 font-medium">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {vouchers.map(v => (
                <tr key={v.id} className="border-t hover:bg-muted/20">
                  <td className="p-3 font-mono font-bold text-xs">{v.code}</td>
                  <td className="p-3">{v.name}</td>
                  <td className="p-3 text-muted-foreground capitalize">{v.type}</td>
                  <td className="p-3 text-right font-semibold">
                    {v.type === 'percentage' ? `${parseFloat(v.value)}%` : formatRupiah(v.value)}
                  </td>
                  <td className="p-3 text-right text-muted-foreground">
                    {v.used_count}{v.max_uses ? `/${v.max_uses}` : ''}
                  </td>
                  <td className="p-3 text-center">
                    <Badge variant={v.is_active ? 'default' : 'secondary'} className="text-xs">
                      {v.is_active ? 'Aktif' : 'Nonaktif'}
                    </Badge>
                  </td>
                  <td className="p-3">
                    <div className="flex gap-1 justify-end">
                      <Button size="sm" variant="ghost" onClick={() => openEdit(v)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-destructive"
                        onClick={() => { if (confirm('Hapus voucher ini?')) deleteMutation.mutate(v.id) }}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={showForm || !!editing} onOpenChange={() => { setShowForm(false); setEditing(null) }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Voucher' : 'Buat Voucher'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label>Kode</Label>
                <Input
                  value={formData.code}
                  onChange={e => setFormData(p => ({ ...p, code: e.target.value.toUpperCase() }))}
                  placeholder="DISC10"
                  disabled={!!editing}
                />
              </div>
              <div>
                <Label>Nama</Label>
                <Input value={formData.name} onChange={e => setFormData(p => ({ ...p, name: e.target.value }))} placeholder="Diskon 10%" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label>Tipe</Label>
                <Select value={formData.type} onValueChange={(v: VoucherForm['type']) => setFormData(p => ({ ...p, type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Persentase (%)</SelectItem>
                    <SelectItem value="fixed">Nominal (Rp)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Nilai {formData.type === 'percentage' ? '(%)' : '(Rp)'}</Label>
                <Input type="number" value={formData.value} onChange={e => setFormData(p => ({ ...p, value: e.target.value }))} placeholder="10" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label>Min. Order (Rp)</Label>
                <Input type="number" value={formData.min_order_amount} onChange={e => setFormData(p => ({ ...p, min_order_amount: e.target.value }))} placeholder="0" />
              </div>
              <div>
                <Label>Maks. Diskon (Rp)</Label>
                <Input type="number" value={formData.max_discount_amount} onChange={e => setFormData(p => ({ ...p, max_discount_amount: e.target.value }))} placeholder="Tidak terbatas" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label>Berlaku Dari</Label>
                <Input type="datetime-local" value={formData.valid_from} onChange={e => setFormData(p => ({ ...p, valid_from: e.target.value }))} />
              </div>
              <div>
                <Label>Berlaku Sampai</Label>
                <Input type="datetime-local" value={formData.valid_until} onChange={e => setFormData(p => ({ ...p, valid_until: e.target.value }))} />
              </div>
            </div>
            <div>
              <Label>Maks. Penggunaan</Label>
              <Input type="number" value={formData.max_uses} onChange={e => setFormData(p => ({ ...p, max_uses: e.target.value }))} placeholder="Tidak terbatas" />
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={formData.is_active} onCheckedChange={v => setFormData(p => ({ ...p, is_active: v }))} />
              <Label>Aktif</Label>
            </div>
            <Button className="w-full" disabled={createMutation.isPending || updateMutation.isPending || !formData.code || !formData.name || !formData.value} onClick={handleSubmit}>
              {editing ? 'Simpan' : 'Buat Voucher'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
