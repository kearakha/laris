'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useMutation } from '@tanstack/react-query'
import { CheckCircle2, ChevronRight, Store, Menu, Table2, ChefHat } from 'lucide-react'
import { toast } from 'sonner'
import { useAuthStore } from '@/lib/stores/authStore'
import apiClient from '@/lib/api/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

const STEPS = [
  { id: 'outlet', label: 'Info Outlet', icon: Store },
  { id: 'menu', label: 'Menu Pertama', icon: Menu },
  { id: 'tables', label: 'Meja', icon: Table2 },
  { id: 'done', label: 'Selesai', icon: ChefHat },
]

interface OutletForm { name: string; address: string; phone: string }
interface MenuForm { name: string; price: string; category: string }
interface TableForm { count: string; prefix: string }

export default function OnboardingPage() {
  const router = useRouter()
  const { user } = useAuthStore()
  const outletId = user?.outlet?.id
  const headers = outletId ? { 'X-Outlet-Id': String(outletId) } : {}

  const [step, setStep] = useState(0)
  const [outlet, setOutlet] = useState<OutletForm>({ name: '', address: '', phone: '' })
  const [menu, setMenu] = useState<MenuForm>({ name: '', price: '', category: 'Makanan' })
  const [tables, setTables] = useState<TableForm>({ count: '5', prefix: 'Meja' })
  const [completed, setCompleted] = useState<Record<string, boolean>>({})

  const outletMutation = useMutation({
    mutationFn: () => apiClient.put('/api/v1/outlet/settings', {
      receipt_header: `Selamat datang di ${outlet.name}`,
    }, { headers }),
    onSuccess: () => {
      setCompleted(c => ({ ...c, outlet: true }))
      setStep(1)
    },
    onError: () => toast.error('Gagal menyimpan info outlet'),
  })

  const menuMutation = useMutation({
    mutationFn: async () => {
      // Create category then item
      const catRes = await apiClient.post('/api/v1/outlet/menu/categories', {
        name: menu.category,
        sort_order: 1,
        is_active: true,
      }, { headers })
      const catId = catRes.data?.data?.id
      await apiClient.post('/api/v1/outlet/menu/items', {
        category_id: catId,
        name: menu.name,
        base_price: parseFloat(menu.price),
        is_available: true,
      }, { headers })
    },
    onSuccess: () => {
      setCompleted(c => ({ ...c, menu: true }))
      setStep(2)
    },
    onError: () => toast.error('Gagal membuat menu'),
  })

  const tablesMutation = useMutation({
    mutationFn: async () => {
      const count = parseInt(tables.count) || 5
      for (let i = 1; i <= count; i++) {
        await apiClient.post('/api/v1/outlet/tables', {
          name: `${tables.prefix} ${i}`,
          capacity: 4,
        }, { headers })
      }
    },
    onSuccess: () => {
      setCompleted(c => ({ ...c, tables: true }))
      setStep(3)
    },
    onError: () => toast.error('Gagal membuat meja'),
  })

  const handleNext = () => {
    if (step === 0) outletMutation.mutate()
    else if (step === 1) {
      if (!menu.name || !menu.price) { toast.error('Isi nama dan harga menu'); return }
      menuMutation.mutate()
    }
    else if (step === 2) tablesMutation.mutate()
    else router.push('/outlet/pos')
  }

  const isPending = outletMutation.isPending || menuMutation.isPending || tablesMutation.isPending
  const currentStep = STEPS[step]

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center p-6">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-8">
          <span className="text-2xl font-extrabold text-blue-700">LARIS</span>
          <p className="text-gray-500 text-sm mt-1">Setup awal — butuh 2 menit</p>
        </div>

        {/* Step indicators */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {STEPS.map((s, i) => (
            <div key={s.id} className="flex items-center gap-2">
              <div className={cn(
                'h-8 w-8 rounded-full flex items-center justify-center text-xs font-semibold transition-colors',
                completed[s.id] ? 'bg-green-500 text-white' :
                i === step ? 'bg-blue-700 text-white' :
                'bg-gray-100 text-gray-400'
              )}>
                {completed[s.id] ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
              </div>
              {i < STEPS.length - 1 && (
                <div className={cn('h-0.5 w-8 rounded', i < step ? 'bg-green-400' : 'bg-gray-200')} />
              )}
            </div>
          ))}
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl border shadow-sm p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="h-10 w-10 rounded-xl bg-blue-100 flex items-center justify-center">
              <currentStep.icon className="h-5 w-5 text-blue-700" />
            </div>
            <div>
              <p className="text-xs text-gray-400">Langkah {step + 1} dari {STEPS.length}</p>
              <h2 className="font-semibold">{currentStep.label}</h2>
            </div>
          </div>

          {step === 0 && (
            <div className="space-y-4">
              <p className="text-sm text-gray-500">Isi info dasar outlet kamu. Bisa diubah kapan saja di Pengaturan.</p>
              <div>
                <Label className="text-sm mb-1.5 block">Nama Outlet *</Label>
                <Input placeholder="Kafe Nusantara" value={outlet.name} onChange={e => setOutlet(o => ({ ...o, name: e.target.value }))} />
              </div>
              <div>
                <Label className="text-sm mb-1.5 block">Alamat</Label>
                <Input placeholder="Jl. Sudirman No. 1, Jakarta" value={outlet.address} onChange={e => setOutlet(o => ({ ...o, address: e.target.value }))} />
              </div>
              <div>
                <Label className="text-sm mb-1.5 block">No. Telepon</Label>
                <Input placeholder="08xx-xxxx-xxxx" value={outlet.phone} onChange={e => setOutlet(o => ({ ...o, phone: e.target.value }))} />
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <p className="text-sm text-gray-500">Tambahkan 1 menu untuk memulai. Kamu bisa tambah lebih banyak nanti.</p>
              <div>
                <Label className="text-sm mb-1.5 block">Kategori</Label>
                <Input placeholder="Makanan" value={menu.category} onChange={e => setMenu(m => ({ ...m, category: e.target.value }))} />
              </div>
              <div>
                <Label className="text-sm mb-1.5 block">Nama Menu *</Label>
                <Input placeholder="Nasi Goreng Spesial" value={menu.name} onChange={e => setMenu(m => ({ ...m, name: e.target.value }))} />
              </div>
              <div>
                <Label className="text-sm mb-1.5 block">Harga (Rp) *</Label>
                <Input type="number" placeholder="25000" value={menu.price} onChange={e => setMenu(m => ({ ...m, price: e.target.value }))} />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <p className="text-sm text-gray-500">Buat meja secara otomatis. Kamu bisa ubah nama dan atur posisi di Denah Meja.</p>
              <div>
                <Label className="text-sm mb-1.5 block">Jumlah Meja</Label>
                <Input type="number" min="1" max="50" value={tables.count} onChange={e => setTables(t => ({ ...t, count: e.target.value }))} className="w-24" />
              </div>
              <div>
                <Label className="text-sm mb-1.5 block">Prefix Nama Meja</Label>
                <Input placeholder="Meja" value={tables.prefix} onChange={e => setTables(t => ({ ...t, prefix: e.target.value }))} className="w-40" />
                <p className="text-xs text-gray-400 mt-1">
                  Akan dibuat: {tables.prefix} 1, {tables.prefix} 2, ... {tables.prefix} {tables.count}
                </p>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="text-center py-4">
              <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Setup Selesai! 🎉</h3>
              <p className="text-sm text-gray-500 mb-1">Outlet, menu, dan meja sudah siap.</p>
              <p className="text-sm text-gray-500">Sekarang kamu bisa mulai terima order lewat POS atau QR Code.</p>
            </div>
          )}

          <div className="mt-6 flex justify-between">
            {step > 0 && step < 3 && (
              <Button variant="ghost" size="sm" onClick={() => setStep(s => s - 1)}>
                ← Kembali
              </Button>
            )}
            <Button
              className="ml-auto"
              disabled={isPending || (step === 0 && !outlet.name)}
              onClick={handleNext}
            >
              {isPending ? 'Menyimpan...' : step === 3 ? 'Mulai Pakai LARIS →' : (
                <>{step === 2 ? 'Buat Meja' : 'Lanjut'} <ChevronRight className="h-4 w-4 ml-1" /></>
              )}
            </Button>
          </div>
        </div>

        {step < 3 && (
          <p className="text-center text-xs text-gray-400 mt-4">
            <button onClick={() => router.push('/outlet/pos')} className="underline hover:text-gray-600">
              Lewati setup, langsung ke POS
            </button>
          </p>
        )}
      </div>
    </div>
  )
}
