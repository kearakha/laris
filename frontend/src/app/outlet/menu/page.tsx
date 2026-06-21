'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Pencil, Trash2, ToggleLeft, ToggleRight, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { menuApi, type MenuCategory, type MenuItem } from '@/lib/api/outlet'
import { useAuthStore } from '@/lib/stores/authStore'
import { cn } from '@/lib/utils'

const TAG_COLORS: Record<string, string> = {
  spicy: 'bg-red-100 text-red-700',
  vegetarian: 'bg-green-100 text-green-700',
  bestseller: 'bg-amber-100 text-amber-700',
  new: 'bg-blue-100 text-blue-700',
  halal: 'bg-emerald-100 text-emerald-700',
}

export default function MenuPage() {
  const { user } = useAuthStore()
  const outletId = user?.outlet?.id
  const qc = useQueryClient()
  const [selectedCat, setSelectedCat] = useState<number | null>(null)

  const { data: catData } = useQuery({
    queryKey: ['menu-categories', outletId],
    queryFn: () => menuApi.getCategories(outletId),
  })

  const { data: itemData, isLoading } = useQuery({
    queryKey: ['menu-items', outletId, selectedCat],
    queryFn: () => menuApi.getItems(selectedCat ? { category_id: selectedCat } : {}, outletId),
  })

  const toggleMutation = useMutation({
    mutationFn: (id: number) => menuApi.toggleAvailability(id, outletId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['menu-items'] }),
    onError: () => toast.error('Gagal mengubah ketersediaan'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => menuApi.deleteItem(id, outletId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['menu-items'] })
      toast.success('Menu dihapus')
    },
    onError: () => toast.error('Gagal menghapus menu'),
  })

  const categories: MenuCategory[] = catData?.data?.data ?? []
  const items: MenuItem[] = itemData?.data?.data?.data ?? []

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Menu</h1>
          <p className="text-sm text-muted-foreground mt-1">Kelola item menu outlet</p>
        </div>
        <div className="flex gap-2">
          <Link href="/outlet/menu/categories">
            <Button variant="outline" size="sm">Kategori</Button>
          </Link>
          <Link href="/outlet/menu/new">
            <Button size="sm"><Plus className="h-4 w-4 mr-1" /> Tambah Menu</Button>
          </Link>
        </div>
      </div>

      <div className="flex gap-4">
        {/* Category filter */}
        <div className="w-48 shrink-0">
          <div className="space-y-1">
            <button
              onClick={() => setSelectedCat(null)}
              className={cn(
                'w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors',
                selectedCat === null ? 'bg-primary text-primary-foreground' : 'hover:bg-muted text-muted-foreground'
              )}
            >
              Semua Menu
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCat(cat.id)}
                className={cn(
                  'w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center justify-between',
                  selectedCat === cat.id ? 'bg-primary text-primary-foreground' : 'hover:bg-muted text-muted-foreground'
                )}
              >
                <span>{cat.name}</span>
                {cat.menu_items_count !== undefined && (
                  <span className="text-xs opacity-70">{cat.menu_items_count}</span>
                )}
              </button>
            ))}
          </div>
        </div>

        <Separator orientation="vertical" className="h-auto" />

        {/* Items list */}
        <div className="flex-1">
          {isLoading ? (
            <div className="text-sm text-muted-foreground">Memuat menu...</div>
          ) : items.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>Belum ada menu.</p>
              <Link href="/outlet/menu/new">
                <Button size="sm" className="mt-3"><Plus className="h-4 w-4 mr-1" />Tambah Menu</Button>
              </Link>
            </div>
          ) : (
            <div className="grid gap-3">
              {items.map((item) => (
                <div key={item.id} className="flex items-center gap-4 p-4 border rounded-lg bg-card hover:bg-muted/30 transition-colors">
                  {item.image ? (
                    <img src={item.image} alt={item.name} className="h-14 w-14 rounded-md object-cover shrink-0" />
                  ) : (
                    <div className="h-14 w-14 rounded-md bg-muted flex items-center justify-center text-xl shrink-0">🍽️</div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium truncate">{item.name}</p>
                      {item.tags.map((t) => (
                        <span key={t.id} className={cn('text-xs px-1.5 py-0.5 rounded-full font-medium', TAG_COLORS[t.tag] ?? 'bg-muted text-muted-foreground')}>
                          {t.tag}
                        </span>
                      ))}
                    </div>
                    <p className="text-sm text-muted-foreground">{item.category?.name}</p>
                    <p className="text-sm font-semibold mt-0.5">Rp {parseInt(item.base_price).toLocaleString('id-ID')}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => toggleMutation.mutate(item.id)}
                      className={cn('transition-colors', item.is_available ? 'text-green-600 hover:text-green-700' : 'text-muted-foreground hover:text-foreground')}
                      title={item.is_available ? 'Tersedia (klik untuk ubah)' : 'Tidak tersedia (klik untuk ubah)'}
                    >
                      {item.is_available ? <ToggleRight className="h-6 w-6" /> : <ToggleLeft className="h-6 w-6" />}
                    </button>
                    <Link href={`/outlet/menu/${item.id}`}>
                      <Button variant="ghost" size="sm"><Pencil className="h-4 w-4" /></Button>
                    </Link>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() => { if (confirm(`Hapus "${item.name}"?`)) deleteMutation.mutate(item.id) }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
