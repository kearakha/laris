'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Plus, Pencil, Trash2, Truck } from 'lucide-react'
import { toast } from 'sonner'
import { inventoryApi, type Supplier } from '@/lib/api/outlet'
import { useAuthStore } from '@/lib/stores/authStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import Link from 'next/link'

const emptyForm = { name: '', contact_name: '', phone: '', email: '', address: '' }

export default function SuppliersPage() {
  const { user } = useAuthStore()
  const outletId = user?.outlet?.id
  const qc = useQueryClient()

  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Supplier | null>(null)
  const [formData, setFormData] = useState(emptyForm)

  const { data, isLoading } = useQuery({
    queryKey: ['suppliers', outletId],
    queryFn: () => inventoryApi.getSuppliers(outletId),
  })

  const createMutation = useMutation({
    mutationFn: (d: typeof formData) => inventoryApi.createSupplier(d, outletId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['suppliers'] })
      toast.success('Supplier ditambahkan')
      setShowForm(false)
      setFormData(emptyForm)
    },
    onError: () => toast.error('Gagal menambah supplier'),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Supplier> }) =>
      inventoryApi.updateSupplier(id, data, outletId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['suppliers'] })
      toast.success('Supplier diupdate')
      setEditing(null)
    },
    onError: () => toast.error('Gagal mengupdate'),
  })

  const suppliers: Supplier[] = data?.data?.data ?? []

  const openEdit = (s: Supplier) => {
    setEditing(s)
    setFormData({ name: s.name, contact_name: s.contact_name ?? '', phone: s.phone ?? '', email: s.email ?? '', address: s.address ?? '' })
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/outlet/inventory"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">Supplier</h1>
          <p className="text-muted-foreground text-sm">Kelola data pemasok bahan baku</p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4 mr-1" /> Tambah Supplier
        </Button>
      </div>

      {isLoading ? (
        <div className="text-sm text-muted-foreground">Memuat...</div>
      ) : suppliers.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Truck className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>Belum ada supplier</p>
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left p-3 font-medium">Nama</th>
                <th className="text-left p-3 font-medium">Kontak</th>
                <th className="text-left p-3 font-medium">Telepon</th>
                <th className="text-left p-3 font-medium">Email</th>
                <th className="text-right p-3 font-medium">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {suppliers.map(s => (
                <tr key={s.id} className="border-t hover:bg-muted/20">
                  <td className="p-3 font-medium">{s.name}</td>
                  <td className="p-3 text-muted-foreground">{s.contact_name ?? '-'}</td>
                  <td className="p-3 text-muted-foreground">{s.phone ?? '-'}</td>
                  <td className="p-3 text-muted-foreground">{s.email ?? '-'}</td>
                  <td className="p-3">
                    <div className="flex gap-1 justify-end">
                      <Button size="sm" variant="ghost" onClick={() => openEdit(s)}>
                        <Pencil className="h-3.5 w-3.5" />
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
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Supplier' : 'Tambah Supplier'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {(['name', 'contact_name', 'phone', 'email'] as const).map(field => (
              <div key={field}>
                <Label className="capitalize">{field.replace('_', ' ')}</Label>
                <Input
                  value={formData[field]}
                  onChange={e => setFormData(p => ({ ...p, [field]: e.target.value }))}
                  placeholder={field}
                />
              </div>
            ))}
            <div>
              <Label>Alamat</Label>
              <Input value={formData.address} onChange={e => setFormData(p => ({ ...p, address: e.target.value }))} placeholder="Alamat..." />
            </div>
            <Button
              className="w-full"
              disabled={createMutation.isPending || updateMutation.isPending || !formData.name}
              onClick={() => {
                if (editing) updateMutation.mutate({ id: editing.id, data: formData })
                else createMutation.mutate(formData)
              }}
            >
              {editing ? 'Simpan' : 'Tambah'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
