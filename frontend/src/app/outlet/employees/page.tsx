'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Users, Clock, Calendar, LogIn, LogOut } from 'lucide-react'
import { toast } from 'sonner'
import { useAuthStore } from '@/lib/stores/authStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import apiClient from '@/lib/api/client'

interface Employee {
  id: number
  employee_code: string
  position: string
  salary_type: string
  hired_at: string
  user: { id: number; name: string; email: string | null; phone: string | null }
}

interface Attendance {
  id: number
  employee_id: number
  date: string
  clock_in: string | null
  clock_out: string | null
  status: string
  employee?: { user: { name: string } }
}

const ROLES = ['kasir', 'inventory_staff', 'kitchen_staff', 'supervisor', 'outlet_manager']
const STATUS_COLORS: Record<string, string> = {
  present: 'bg-green-100 text-green-700',
  late:    'bg-amber-100 text-amber-700',
  absent:  'bg-red-100 text-red-700',
  leave:   'bg-blue-100 text-blue-700',
}

const emptyForm = { name: '', email: '', phone: '', password: '', role: 'kasir', position: '', salary_type: 'monthly', salary_amount: '', hired_at: '' }

export default function EmployeesPage() {
  const { user } = useAuthStore()
  const outletId = user?.outlet?.id
  const qc = useQueryClient()
  const headers = outletId ? { 'X-Outlet-Id': String(outletId) } : {}

  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [dateFilter, setDateFilter] = useState(new Date().toISOString().split('T')[0])

  const { data: empData } = useQuery({
    queryKey: ['employees', outletId],
    queryFn: () => apiClient.get('/api/v1/outlet/employees', { headers }),
  })

  const { data: attData, refetch: refetchAtt } = useQuery({
    queryKey: ['attendance', outletId, dateFilter],
    queryFn: () => apiClient.get('/api/v1/outlet/attendance', { params: { date: dateFilter }, headers }),
  })

  const createMutation = useMutation({
    mutationFn: () => apiClient.post('/api/v1/outlet/employees', {
      ...form,
      salary_amount: form.salary_amount ? parseFloat(form.salary_amount) : 0,
    }, { headers }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['employees'] })
      toast.success('Karyawan ditambahkan')
      setShowCreate(false)
      setForm(emptyForm)
    },
    onError: (e: { response?: { data?: { message?: string } } }) =>
      toast.error(e.response?.data?.message ?? 'Gagal menambah karyawan'),
  })

  const clockInMutation = useMutation({
    mutationFn: (empId: number) => apiClient.post(`/api/v1/outlet/employees/${empId}/clock-in`, {}, { headers }),
    onSuccess: () => { refetchAtt(); toast.success('Clock in') },
    onError: (e: { response?: { data?: { message?: string } } }) => toast.error(e.response?.data?.message ?? 'Gagal'),
  })

  const clockOutMutation = useMutation({
    mutationFn: (empId: number) => apiClient.post(`/api/v1/outlet/employees/${empId}/clock-out`, {}, { headers }),
    onSuccess: () => { refetchAtt(); toast.success('Clock out') },
    onError: (e: { response?: { data?: { message?: string } } }) => toast.error(e.response?.data?.message ?? 'Gagal'),
  })

  const employees: Employee[] = empData?.data?.data ?? []
  const attendances: Attendance[] = attData?.data?.data ?? []

  const getAttendance = (empId: number) => attendances.find(a => a.employee_id === empId)

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Karyawan</h1>
          <p className="text-muted-foreground text-sm">Kelola karyawan, shift, dan absensi</p>
        </div>
      </div>

      <Tabs defaultValue="employees">
        <TabsList className="mb-4">
          <TabsTrigger value="employees">Karyawan</TabsTrigger>
          <TabsTrigger value="attendance">Absensi</TabsTrigger>
        </TabsList>

        <TabsContent value="employees">
          <div className="flex justify-end mb-4">
            <Button onClick={() => setShowCreate(true)}>
              <Plus className="h-4 w-4 mr-1" /> Tambah Karyawan
            </Button>
          </div>

          {employees.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>Belum ada karyawan</p>
            </div>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left p-3 font-medium">Kode</th>
                    <th className="text-left p-3 font-medium">Nama</th>
                    <th className="text-left p-3 font-medium">Posisi</th>
                    <th className="text-left p-3 font-medium">Kontak</th>
                    <th className="text-left p-3 font-medium">Mulai</th>
                  </tr>
                </thead>
                <tbody>
                  {employees.map(emp => (
                    <tr key={emp.id} className="border-t hover:bg-muted/20">
                      <td className="p-3 font-mono text-xs text-muted-foreground">{emp.employee_code}</td>
                      <td className="p-3 font-medium">{emp.user.name}</td>
                      <td className="p-3 text-muted-foreground">{emp.position}</td>
                      <td className="p-3 text-muted-foreground text-xs">{emp.user.phone ?? emp.user.email ?? '-'}</td>
                      <td className="p-3 text-muted-foreground text-xs">{new Date(emp.hired_at).toLocaleDateString('id-ID')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>

        <TabsContent value="attendance">
          <div className="flex items-center gap-3 mb-4">
            <Input type="date" value={dateFilter} onChange={e => setDateFilter(e.target.value)} className="max-w-xs" />
            <span className="text-sm text-muted-foreground">{attendances.length} dari {employees.length} hadir</span>
          </div>

          {employees.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <Clock className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>Belum ada karyawan</p>
            </div>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left p-3 font-medium">Nama</th>
                    <th className="text-left p-3 font-medium">Posisi</th>
                    <th className="text-center p-3 font-medium">Clock In</th>
                    <th className="text-center p-3 font-medium">Clock Out</th>
                    <th className="text-center p-3 font-medium">Status</th>
                    <th className="text-right p-3 font-medium">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {employees.map(emp => {
                    const att = getAttendance(emp.id)
                    return (
                      <tr key={emp.id} className="border-t hover:bg-muted/20">
                        <td className="p-3 font-medium">{emp.user.name}</td>
                        <td className="p-3 text-muted-foreground">{emp.position}</td>
                        <td className="p-3 text-center text-xs">
                          {att?.clock_in ? new Date(att.clock_in).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '-'}
                        </td>
                        <td className="p-3 text-center text-xs">
                          {att?.clock_out ? new Date(att.clock_out).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '-'}
                        </td>
                        <td className="p-3 text-center">
                          {att ? (
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[att.status] ?? ''}`}>
                              {att.status}
                            </span>
                          ) : (
                            <Badge variant="outline" className="text-xs">Belum</Badge>
                          )}
                        </td>
                        <td className="p-3 text-right">
                          {dateFilter === new Date().toISOString().split('T')[0] && (
                            <>
                              {!att?.clock_in && (
                                <Button size="sm" variant="outline" onClick={() => clockInMutation.mutate(emp.id)}>
                                  <LogIn className="h-3.5 w-3.5 mr-1" /> Masuk
                                </Button>
                              )}
                              {att?.clock_in && !att.clock_out && (
                                <Button size="sm" variant="outline" onClick={() => clockOutMutation.mutate(emp.id)}>
                                  <LogOut className="h-3.5 w-3.5 mr-1" /> Pulang
                                </Button>
                              )}
                            </>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Create Employee Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Tambah Karyawan</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label>Nama</Label>
                <Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Nama lengkap" />
              </div>
              <div>
                <Label>Password</Label>
                <Input type="password" value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label>Email (opsional)</Label>
                <Input value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} />
              </div>
              <div>
                <Label>Telepon</Label>
                <Input value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label>Role</Label>
                <Select value={form.role} onValueChange={v => setForm(p => ({ ...p, role: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {ROLES.map(r => <SelectItem key={r} value={r}>{r.replace('_', ' ')}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Posisi/Jabatan</Label>
                <Input value={form.position} onChange={e => setForm(p => ({ ...p, position: e.target.value }))} placeholder="Kasir, Chef, dll" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label>Tipe Gaji</Label>
                <Select value={form.salary_type} onValueChange={v => setForm(p => ({ ...p, salary_type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">Bulanan</SelectItem>
                    <SelectItem value="daily">Harian</SelectItem>
                    <SelectItem value="hourly">Per Jam</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Nominal Gaji</Label>
                <Input type="number" value={form.salary_amount} onChange={e => setForm(p => ({ ...p, salary_amount: e.target.value }))} />
              </div>
            </div>
            <div>
              <Label>Tanggal Mulai</Label>
              <Input type="date" value={form.hired_at} onChange={e => setForm(p => ({ ...p, hired_at: e.target.value }))} />
            </div>
            <Button
              className="w-full"
              disabled={createMutation.isPending || !form.name || !form.password || !form.position || !form.hired_at}
              onClick={() => createMutation.mutate()}
            >
              Tambah Karyawan
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
