'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Trash2, QrCode, Users } from 'lucide-react'
import { toast } from 'sonner'
import { QRCodeSVG } from 'qrcode.react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { tableApi, type DiningTable } from '@/lib/api/outlet'
import { useAuthStore } from '@/lib/stores/authStore'
import { cn } from '@/lib/utils'

const STATUS_LABEL: Record<string, { label: string; class: string }> = {
  available: { label: 'Tersedia', class: 'bg-green-100 text-green-700' },
  occupied: { label: 'Terisi', class: 'bg-red-100 text-red-700' },
  reserved: { label: 'Reserved', class: 'bg-amber-100 text-amber-700' },
}

export default function TablesPage() {
  const { user } = useAuthStore()
  const outletId = user?.outlet?.id
  const qc = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [qrPreview, setQrPreview] = useState<DiningTable | null>(null)
  const [newName, setNewName] = useState('')
  const [newCapacity, setNewCapacity] = useState('4')

  const { data, isLoading } = useQuery({
    queryKey: ['tables', outletId],
    queryFn: () => tableApi.getTables(outletId),
  })

  const createMutation = useMutation({
    mutationFn: () => tableApi.createTable({ name: newName, capacity: Number(newCapacity) }, outletId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tables'] })
      toast.success('Meja berhasil ditambahkan')
      setShowForm(false)
      setNewName('')
    },
    onError: () => toast.error('Gagal menambahkan meja'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => tableApi.deleteTable(id, outletId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tables'] })
      toast.success('Meja dihapus')
    },
    onError: () => toast.error('Gagal menghapus meja'),
  })

  const tables: DiningTable[] = data?.data?.data ?? []
  const qrBaseUrl = typeof window !== 'undefined' ? window.location.origin : ''

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Meja</h1>
          <p className="text-sm text-muted-foreground mt-1">Kelola meja dan QR code</p>
        </div>
        <Button size="sm" onClick={() => setShowForm(!showForm)}>
          <Plus className="h-4 w-4 mr-1" />Tambah Meja
        </Button>
      </div>

      {showForm && (
        <div className="border rounded-lg p-4 mb-6 bg-muted/30 max-w-sm">
          <h3 className="font-medium mb-3">Meja Baru</h3>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label>Nama Meja</Label>
              <Input placeholder="Meja 11" value={newName} onChange={e => setNewName(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Kapasitas</Label>
              <Input type="number" placeholder="4" value={newCapacity} onChange={e => setNewCapacity(e.target.value)} />
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => setShowForm(false)}>Batal</Button>
              <Button size="sm" onClick={() => createMutation.mutate()} disabled={!newName || createMutation.isPending}>
                {createMutation.isPending ? 'Menyimpan...' : 'Simpan'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="text-sm text-muted-foreground">Memuat meja...</div>
      ) : tables.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p>Belum ada meja. Tambahkan meja pertama.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {tables.map((table) => {
            const statusInfo = STATUS_LABEL[table.status] ?? { label: table.status, class: 'bg-muted text-muted-foreground' }
            return (
              <div key={table.id} className="border rounded-lg p-4 bg-card text-center space-y-2 hover:shadow-sm transition-shadow">
                <div className="font-semibold">{table.name}</div>
                <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
                  <Users className="h-3 w-3" />{table.capacity}
                </div>
                <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', statusInfo.class)}>
                  {statusInfo.label}
                </span>
                <div className="flex justify-center gap-1 pt-1">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => setQrPreview(table)}
                  >
                    <QrCode className="h-3 w-3 mr-1" />QR
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-destructive hover:text-destructive"
                    onClick={() => { if (confirm(`Hapus ${table.name}?`)) deleteMutation.mutate(table.id) }}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* QR Preview Modal */}
      {qrPreview && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setQrPreview(null)}>
          <div className="bg-card rounded-xl p-6 text-center space-y-4 shadow-xl" onClick={e => e.stopPropagation()}>
            <h3 className="font-bold text-lg">{qrPreview.name}</h3>
            <div className="p-3 bg-white rounded-lg inline-block">
              <QRCodeSVG
                value={`${qrBaseUrl}/order/${qrPreview.qr_code}`}
                size={200}
              />
            </div>
            <p className="text-xs text-muted-foreground font-mono break-all max-w-xs">
              {qrBaseUrl}/order/{qrPreview.qr_code}
            </p>
            <div className="flex gap-2 justify-center">
              <Button variant="outline" size="sm" onClick={() => setQrPreview(null)}>Tutup</Button>
              <Button size="sm" onClick={() => window.print()}>Print</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
