'use client'

import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, X, ChefHat, TrendingUp, TrendingDown } from 'lucide-react'
import { toast } from 'sonner'
import { useAuthStore } from '@/lib/stores/authStore'
import { formatRupiah } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { inventoryApi, type Ingredient } from '@/lib/api/outlet'
import apiClient from '@/lib/api/client'

interface CostingRow {
  id: number
  name: string
  sell_price: number
  hpp: number
  margin: number | null
  profit: number
}

interface RecipeIngredient {
  id: number
  ingredient_id: number
  quantity_used: string
  ingredient: Ingredient
}

export default function CostingPage() {
  const { user } = useAuthStore()
  const outletId = user?.outlet?.id
  const qc = useQueryClient()
  const headers = outletId ? { 'X-Outlet-Id': String(outletId) } : {}

  const [editingItem, setEditingItem] = useState<{ id: number; name: string } | null>(null)
  const [recipeRows, setRecipeRows] = useState<Array<{ ingredient_id: string; quantity_used: string }>>([
    { ingredient_id: '', quantity_used: '' },
  ])

  const { data: costingData, isLoading } = useQuery({
    queryKey: ['costing-report', outletId],
    queryFn: () => apiClient.get('/api/v1/outlet/menu/costing-report', { headers }),
  })

  const { data: ingredientsData } = useQuery({
    queryKey: ['ingredients', outletId],
    queryFn: () => inventoryApi.getIngredients({}, outletId),
  })

  const { data: recipeData } = useQuery({
    queryKey: ['recipe', editingItem?.id],
    queryFn: () => apiClient.get(`/api/v1/outlet/menu/items/${editingItem!.id}/recipe`, { headers }),
    enabled: !!editingItem,
  })

  useEffect(() => {
    if (!recipeData) return
    const existing: RecipeIngredient[] = recipeData.data?.data?.recipe ?? []
    if (existing.length > 0) {
      setRecipeRows(existing.map((r: RecipeIngredient) => ({
        ingredient_id: String(r.ingredient_id),
        quantity_used: r.quantity_used,
      })))
    } else {
      setRecipeRows([{ ingredient_id: '', quantity_used: '' }])
    }
  }, [recipeData])

  const saveMutation = useMutation({
    mutationFn: () => apiClient.put(`/api/v1/outlet/menu/items/${editingItem!.id}/recipe`, {
      ingredients: recipeRows
        .filter(r => r.ingredient_id && r.quantity_used)
        .map(r => ({
          ingredient_id: parseInt(r.ingredient_id),
          quantity_used: parseFloat(r.quantity_used),
        })),
    }, { headers }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['costing-report'] })
      toast.success('Resep disimpan')
      setEditingItem(null)
    },
    onError: () => toast.error('Gagal menyimpan resep'),
  })

  const rows: CostingRow[] = costingData?.data?.data ?? []
  const ingredients: Ingredient[] = ingredientsData?.data?.data?.data ?? []

  const marginColor = (margin: number | null) => {
    if (margin === null) return 'text-muted-foreground'
    if (margin >= 60) return 'text-green-600'
    if (margin >= 40) return 'text-amber-600'
    return 'text-red-600'
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Recipe Costing & HPP</h1>
        <p className="text-muted-foreground text-sm">Hitung Harga Pokok Penjualan per menu</p>
      </div>

      {isLoading ? (
        <div className="text-sm text-muted-foreground">Memuat...</div>
      ) : rows.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <ChefHat className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>Belum ada menu. Tambah menu terlebih dahulu.</p>
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left p-3 font-medium">Menu</th>
                <th className="text-right p-3 font-medium">Harga Jual</th>
                <th className="text-right p-3 font-medium">HPP</th>
                <th className="text-right p-3 font-medium">Profit</th>
                <th className="text-right p-3 font-medium">Margin</th>
                <th className="text-right p-3 font-medium">Resep</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(row => (
                <tr key={row.id} className="border-t hover:bg-muted/20">
                  <td className="p-3 font-medium">{row.name}</td>
                  <td className="p-3 text-right">{formatRupiah(row.sell_price)}</td>
                  <td className="p-3 text-right">
                    {row.hpp > 0 ? formatRupiah(row.hpp) : <span className="text-muted-foreground">-</span>}
                  </td>
                  <td className="p-3 text-right">
                    {row.hpp > 0 ? (
                      <span className={row.profit >= 0 ? 'text-green-600' : 'text-red-600'}>
                        {formatRupiah(row.profit)}
                      </span>
                    ) : <span className="text-muted-foreground">-</span>}
                  </td>
                  <td className="p-3 text-right">
                    {row.margin !== null && row.hpp > 0 ? (
                      <span className={`font-semibold ${marginColor(row.margin)}`}>
                        {row.margin}%
                      </span>
                    ) : (
                      <Badge variant="outline" className="text-xs">Belum ada resep</Badge>
                    )}
                  </td>
                  <td className="p-3 text-right">
                    <Button size="sm" variant="outline" onClick={() => setEditingItem({ id: row.id, name: row.name })}>
                      Edit Resep
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Margin legend */}
      <div className="flex gap-4 mt-3 text-xs text-muted-foreground">
        <span className="text-green-600 font-medium">≥60% Sehat</span>
        <span className="text-amber-600 font-medium">40-60% Wajar</span>
        <span className="text-red-600 font-medium">&lt;40% Perhatian</span>
      </div>

      {/* Edit Recipe Dialog */}
      <Dialog open={!!editingItem} onOpenChange={() => setEditingItem(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Resep — {editingItem?.name}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm font-medium text-muted-foreground border-b pb-2">
              <span className="flex-1">Bahan</span>
              <span className="w-28 text-right">Jumlah</span>
              <span className="w-8" />
            </div>
            {recipeRows.map((row, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="flex-1">
                  <Select value={row.ingredient_id} onValueChange={v => setRecipeRows(p => p.map((r, j) => j === i ? { ...r, ingredient_id: v } : r))}>
                    <SelectTrigger className="text-xs h-8"><SelectValue placeholder="Pilih bahan..." /></SelectTrigger>
                    <SelectContent>
                      {ingredients.map(ing => (
                        <SelectItem key={ing.id} value={String(ing.id)}>{ing.name} ({ing.unit})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Input
                  className="w-28 text-xs h-8"
                  type="number"
                  step="0.001"
                  placeholder="0.000"
                  value={row.quantity_used}
                  onChange={e => setRecipeRows(p => p.map((r, j) => j === i ? { ...r, quantity_used: e.target.value } : r))}
                />
                {recipeRows.length > 1 && (
                  <button onClick={() => setRecipeRows(p => p.filter((_, j) => j !== i))} className="text-destructive">
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setRecipeRows(p => [...p, { ingredient_id: '', quantity_used: '' }])}
            >
              <Plus className="h-3.5 w-3.5 mr-1" /> Tambah Bahan
            </Button>
            <Button
              className="w-full"
              disabled={saveMutation.isPending}
              onClick={() => saveMutation.mutate()}
            >
              Simpan Resep
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
