'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, CalendarCheck, Users, Phone } from 'lucide-react'
import { toast } from 'sonner'
import { useAuthStore } from '@/lib/stores/authStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import apiClient from '@/lib/api/client'

interface Reservation {
  id: number
  guest_name: string
  guest_phone: string
  party_size: number
  date: string
  time: string
  status: string
  notes: string | null
  customer?: { id: number; name: string } | null
}

interface WaitlistEntry {
  id: number
  guest_name: string
  guest_phone: string
  party_size: number
  status: string
  joined_at: string
}

const RESERVATION_STATUS_COLORS: Record<string, string> = {
  pending:   'bg-yellow-100 text-yellow-700',
  confirmed: 'bg-blue-100 text-blue-700',
  seated:    'bg-green-100 text-green-700',
  completed: 'bg-muted text-muted-foreground',
  cancelled: 'bg-red-100 text-red-700',
  no_show:   'bg-red-50 text-red-400',
}

export default function ReservationsPage() {
  const { user } = useAuthStore()
  const outletId = user?.outlet?.id
  const qc = useQueryClient()

  const [showCreate, setShowCreate] = useState(false)
  const [dateFilter, setDateFilter] = useState(new Date().toISOString().split('T')[0])
  const [form, setForm] = useState({ guest_name: '', guest_phone: '', party_size: '2', date: '', time: '', notes: '' })
  const [waitForm, setWaitForm] = useState({ guest_name: '', guest_phone: '', party_size: '2' })
  const [showWaitCreate, setShowWaitCreate] = useState(false)

  const headers = outletId ? { 'X-Outlet-Id': String(outletId) } : {}

  const { data: resData } = useQuery({
    queryKey: ['reservations', outletId, dateFilter],
    queryFn: () => apiClient.get('/api/v1/outlet/reservations', { params: { date: dateFilter }, headers }),
  })

  const { data: waitData } = useQuery({
    queryKey: ['waitlist', outletId],
    queryFn: () => apiClient.get('/api/v1/outlet/waitlist', { headers }),
    refetchInterval: 30000,
  })

  const createMutation = useMutation({
    mutationFn: () => apiClient.post('/api/v1/outlet/reservations', { ...form, party_size: parseInt(form.party_size) }, { headers }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['reservations'] })
      toast.success('Reservasi dibuat')
      setShowCreate(false)
      setForm({ guest_name: '', guest_phone: '', party_size: '2', date: '', time: '', notes: '' })
    },
    onError: () => toast.error('Gagal membuat reservasi'),
  })

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      apiClient.patch(`/api/v1/outlet/reservations/${id}/status`, { status }, { headers }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['reservations'] }); toast.success('Status diupdate') },
    onError: () => toast.error('Gagal update status'),
  })

  const addWaitlistMutation = useMutation({
    mutationFn: () => apiClient.post('/api/v1/outlet/waitlist', { ...waitForm, party_size: parseInt(waitForm.party_size) }, { headers }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['waitlist'] })
      toast.success('Ditambahkan ke waitlist')
      setShowWaitCreate(false)
      setWaitForm({ guest_name: '', guest_phone: '', party_size: '2' })
    },
    onError: () => toast.error('Gagal menambah waitlist'),
  })

  const waitStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      apiClient.patch(`/api/v1/outlet/waitlist/${id}/status`, { status }, { headers }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['waitlist'] }); toast.success('Status diupdate') },
    onError: () => toast.error('Gagal update status'),
  })

  const reservations: Reservation[] = resData?.data?.data?.data ?? []
  const waitlist: WaitlistEntry[] = waitData?.data?.data ?? []

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Reservasi & Waitlist</h1>
          <p className="text-muted-foreground text-sm">Kelola reservasi meja dan antrian tamu</p>
        </div>
      </div>

      <Tabs defaultValue="reservations">
        <TabsList className="mb-4">
          <TabsTrigger value="reservations">Reservasi</TabsTrigger>
          <TabsTrigger value="waitlist">
            Waitlist
            {waitlist.length > 0 && (
              <span className="ml-1.5 bg-primary text-primary-foreground text-xs rounded-full px-1.5 py-0.5">{waitlist.length}</span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="reservations">
          <div className="flex gap-3 mb-4">
            <Input type="date" value={dateFilter} onChange={e => setDateFilter(e.target.value)} className="max-w-xs" />
            <Button onClick={() => setShowCreate(true)}>
              <Plus className="h-4 w-4 mr-1" /> Buat Reservasi
            </Button>
          </div>

          {reservations.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <CalendarCheck className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>Tidak ada reservasi</p>
            </div>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left p-3 font-medium">Tamu</th>
                    <th className="text-left p-3 font-medium">Waktu</th>
                    <th className="text-center p-3 font-medium">Pax</th>
                    <th className="text-center p-3 font-medium">Status</th>
                    <th className="text-right p-3 font-medium">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {reservations.map(r => (
                    <tr key={r.id} className="border-t hover:bg-muted/20">
                      <td className="p-3">
                        <p className="font-medium">{r.guest_name}</p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1"><Phone className="h-3 w-3" />{r.guest_phone}</p>
                      </td>
                      <td className="p-3 text-muted-foreground">{r.time.substring(0, 5)}</td>
                      <td className="p-3 text-center">
                        <span className="flex items-center justify-center gap-1"><Users className="h-3.5 w-3.5" />{r.party_size}</span>
                      </td>
                      <td className="p-3 text-center">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${RESERVATION_STATUS_COLORS[r.status] ?? ''}`}>
                          {r.status}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        {r.status === 'pending' && (
                          <Button size="sm" variant="outline" onClick={() => statusMutation.mutate({ id: r.id, status: 'confirmed' })}>Konfirmasi</Button>
                        )}
                        {r.status === 'confirmed' && (
                          <Button size="sm" variant="outline" onClick={() => statusMutation.mutate({ id: r.id, status: 'seated' })}>Duduk</Button>
                        )}
                        {r.status === 'seated' && (
                          <Button size="sm" variant="outline" onClick={() => statusMutation.mutate({ id: r.id, status: 'completed' })}>Selesai</Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>

        <TabsContent value="waitlist">
          <div className="flex justify-end mb-4">
            <Button onClick={() => setShowWaitCreate(true)}>
              <Plus className="h-4 w-4 mr-1" /> Tambah ke Waitlist
            </Button>
          </div>

          {waitlist.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>Waitlist kosong</p>
            </div>
          ) : (
            <div className="space-y-2">
              {waitlist.map((entry, idx) => (
                <div key={entry.id} className="flex items-center gap-4 p-4 border rounded-lg">
                  <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm shrink-0">
                    {idx + 1}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{entry.guest_name}</p>
                    <p className="text-xs text-muted-foreground">{entry.guest_phone} · {entry.party_size} pax</p>
                  </div>
                  <Badge variant={entry.status === 'notified' ? 'default' : 'secondary'} className="text-xs">
                    {entry.status === 'waiting' ? 'Menunggu' : 'Diberitahu'}
                  </Badge>
                  <div className="flex gap-2">
                    {entry.status === 'waiting' && (
                      <Button size="sm" variant="outline" onClick={() => waitStatusMutation.mutate({ id: entry.id, status: 'notified' })}>
                        Panggil
                      </Button>
                    )}
                    <Button size="sm" variant="outline" onClick={() => waitStatusMutation.mutate({ id: entry.id, status: 'seated' })}>
                      Duduk
                    </Button>
                    <Button size="sm" variant="ghost" className="text-muted-foreground" onClick={() => waitStatusMutation.mutate({ id: entry.id, status: 'left' })}>
                      Pergi
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Create Reservation Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Buat Reservasi</DialogTitle></DialogHeader>
          <div className="space-y-3">
            {(['guest_name', 'guest_phone'] as const).map(field => (
              <div key={field}>
                <Label>{field === 'guest_name' ? 'Nama Tamu' : 'Nomor Telepon'}</Label>
                <Input value={form[field]} onChange={e => setForm(p => ({ ...p, [field]: e.target.value }))} />
              </div>
            ))}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label>Tanggal</Label>
                <Input type="date" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))} />
              </div>
              <div>
                <Label>Jam</Label>
                <Input type="time" value={form.time} onChange={e => setForm(p => ({ ...p, time: e.target.value }))} />
              </div>
            </div>
            <div>
              <Label>Jumlah Pax</Label>
              <Input type="number" min="1" value={form.party_size} onChange={e => setForm(p => ({ ...p, party_size: e.target.value }))} />
            </div>
            <div>
              <Label>Catatan</Label>
              <Input value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} placeholder="Opsional..." />
            </div>
            <Button
              className="w-full"
              disabled={createMutation.isPending || !form.guest_name || !form.date || !form.time}
              onClick={() => createMutation.mutate()}
            >
              Buat Reservasi
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Waitlist Dialog */}
      <Dialog open={showWaitCreate} onOpenChange={setShowWaitCreate}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Tambah ke Waitlist</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Nama Tamu</Label>
              <Input value={waitForm.guest_name} onChange={e => setWaitForm(p => ({ ...p, guest_name: e.target.value }))} />
            </div>
            <div>
              <Label>Nomor Telepon</Label>
              <Input value={waitForm.guest_phone} onChange={e => setWaitForm(p => ({ ...p, guest_phone: e.target.value }))} />
            </div>
            <div>
              <Label>Jumlah Pax</Label>
              <Input type="number" min="1" value={waitForm.party_size} onChange={e => setWaitForm(p => ({ ...p, party_size: e.target.value }))} />
            </div>
            <Button
              className="w-full"
              disabled={addWaitlistMutation.isPending || !waitForm.guest_name}
              onClick={() => addWaitlistMutation.mutate()}
            >
              Tambah
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
