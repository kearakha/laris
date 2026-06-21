'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { menuApi, type MenuItem } from '@/lib/api/outlet'
import { useAuthStore } from '@/lib/stores/authStore'

const schema = z.object({
  name: z.string().min(1, 'Nama wajib diisi'),
  category_id: z.string().min(1, 'Pilih kategori'),
  base_price: z.string().min(1, 'Harga wajib diisi'),
  description: z.string().optional(),
  preparation_time: z.string().optional(),
  is_available: z.boolean().optional(),
  is_featured: z.boolean().optional(),
})
type FormValues = z.infer<typeof schema>

interface VariantOption { label: string; price_modifier: number; is_default: boolean }
interface Variant { name: string; is_required: boolean; options: VariantOption[] }
interface Addon { name: string; price: number; is_available: boolean }

export function MenuItemForm({ item, onSuccess }: { item?: MenuItem; onSuccess: () => void }) {
  const { user } = useAuthStore()
  const outletId = user?.outlet?.id
  const qc = useQueryClient()

  const [variants, setVariants] = useState<Variant[]>(
    item?.variants?.map(v => ({
      name: v.name,
      is_required: v.is_required,
      options: v.options.map(o => ({ label: o.label, price_modifier: Number(o.price_modifier), is_default: o.is_default })),
    })) ?? []
  )
  const [addons, setAddons] = useState<Addon[]>(
    item?.addons?.map(a => ({ name: a.name, price: Number(a.price), is_available: a.is_available })) ?? []
  )
  const [tags, setTags] = useState<string[]>(item?.tags?.map(t => t.tag) ?? [])

  const { data: catData } = useQuery({
    queryKey: ['menu-categories', outletId],
    queryFn: () => menuApi.getCategories(outletId),
  })
  const categories = catData?.data?.data ?? []

  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: item?.name ?? '',
      category_id: item?.category_id ? String(item.category_id) : '',
      base_price: item?.base_price ? String(Math.round(Number(item.base_price))) : '',
      description: item?.description ?? '',
      preparation_time: item?.preparation_time ? String(item.preparation_time) : '10',
      is_available: item?.is_available ?? true,
      is_featured: item?.is_featured ?? false,
    },
  })

  const mutation = useMutation({
    mutationFn: (data: FormValues) => {
      const payload = {
        name: data.name,
        category_id: Number(data.category_id),
        base_price: Number(data.base_price),
        description: data.description,
        preparation_time: Number(data.preparation_time ?? 10),
        is_available: data.is_available,
        is_featured: data.is_featured,
        variants,
        addons,
        tags,
      }
      return item
        ? menuApi.updateItem(item.id, payload, outletId)
        : menuApi.createItem(payload, outletId)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['menu-items'] })
      toast.success(item ? 'Menu diperbarui' : 'Menu ditambahkan')
      onSuccess()
    },
    onError: (e: { response?: { data?: { message?: string } } }) => {
      toast.error(e.response?.data?.message ?? 'Gagal menyimpan menu')
    },
  })

  const allTags = ['spicy', 'vegetarian', 'bestseller', 'new', 'halal']

  const addVariant = () => setVariants(v => [...v, { name: '', is_required: false, options: [{ label: '', price_modifier: 0, is_default: true }] }])
  const addOption = (vi: number) => setVariants(v => v.map((vr, i) => i === vi ? { ...vr, options: [...vr.options, { label: '', price_modifier: 0, is_default: false }] } : vr))
  const addAddon = () => setAddons(a => [...a, { name: '', price: 0, is_available: true }])

  return (
    <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-5">
      <div className="space-y-2">
        <Label>Nama Menu</Label>
        <Input {...register('name')} placeholder="Es Kopi Susu" />
        {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Kategori</Label>
          <select {...register('category_id')} className="w-full border rounded-md px-3 py-2 text-sm bg-background">
            <option value="">Pilih kategori...</option>
            {categories.map((c: { id: number; name: string }) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          {errors.category_id && <p className="text-xs text-destructive">{errors.category_id.message}</p>}
        </div>
        <div className="space-y-2">
          <Label>Harga Dasar (Rp)</Label>
          <Input {...register('base_price')} type="number" placeholder="28000" />
          {errors.base_price && <p className="text-xs text-destructive">{errors.base_price.message}</p>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Estimasi Waktu (menit)</Label>
          <Input {...register('preparation_time')} type="number" placeholder="10" />
        </div>
        <div className="space-y-2">
          <Label>Deskripsi (opsional)</Label>
          <Input {...register('description')} placeholder="Deskripsi singkat..." />
        </div>
      </div>

      <div className="flex gap-4">
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input type="checkbox" {...register('is_available')} className="rounded" />
          Tersedia
        </label>
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input type="checkbox" {...register('is_featured')} className="rounded" />
          Unggulan
        </label>
      </div>

      {/* Tags */}
      <div className="space-y-2">
        <Label>Tag</Label>
        <div className="flex flex-wrap gap-2">
          {allTags.map(tag => (
            <button
              key={tag}
              type="button"
              onClick={() => setTags(t => t.includes(tag) ? t.filter(x => x !== tag) : [...t, tag])}
              className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${tags.includes(tag) ? 'bg-primary text-primary-foreground border-primary' : 'border-input hover:bg-muted'}`}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      {/* Variants */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label>Varian</Label>
          <Button type="button" variant="outline" size="sm" onClick={addVariant}><Plus className="h-3 w-3 mr-1" />Tambah Varian</Button>
        </div>
        {variants.map((variant, vi) => (
          <div key={vi} className="border rounded-lg p-3 space-y-2">
            <div className="flex gap-2">
              <Input
                placeholder="Nama varian (cth: Ukuran)"
                value={variant.name}
                onChange={e => setVariants(v => v.map((vr, i) => i === vi ? { ...vr, name: e.target.value } : vr))}
                className="flex-1"
              />
              <label className="flex items-center gap-1 text-xs whitespace-nowrap cursor-pointer">
                <input type="checkbox" checked={variant.is_required} onChange={e => setVariants(v => v.map((vr, i) => i === vi ? { ...vr, is_required: e.target.checked } : vr))} />
                Wajib
              </label>
              <Button type="button" variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => setVariants(v => v.filter((_, i) => i !== vi))}>
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
            {variant.options.map((opt, oi) => (
              <div key={oi} className="flex gap-2 pl-4">
                <Input placeholder="Label (cth: Besar)" value={opt.label} onChange={e => setVariants(v => v.map((vr, i) => i === vi ? { ...vr, options: vr.options.map((o, j) => j === oi ? { ...o, label: e.target.value } : o) } : vr))} className="flex-1" />
                <Input placeholder="+Harga" type="number" value={opt.price_modifier} onChange={e => setVariants(v => v.map((vr, i) => i === vi ? { ...vr, options: vr.options.map((o, j) => j === oi ? { ...o, price_modifier: Number(e.target.value) } : o) } : vr))} className="w-24" />
                <Button type="button" variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => setVariants(v => v.map((vr, i) => i === vi ? { ...vr, options: vr.options.filter((_, j) => j !== oi) } : vr))}>
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            ))}
            <Button type="button" variant="ghost" size="sm" className="text-xs ml-4" onClick={() => addOption(vi)}><Plus className="h-3 w-3 mr-1" />Tambah Opsi</Button>
          </div>
        ))}
      </div>

      {/* Addons */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label>Add-on</Label>
          <Button type="button" variant="outline" size="sm" onClick={addAddon}><Plus className="h-3 w-3 mr-1" />Tambah Add-on</Button>
        </div>
        {addons.map((addon, ai) => (
          <div key={ai} className="flex gap-2">
            <Input placeholder="Nama add-on (cth: Extra Keju)" value={addon.name} onChange={e => setAddons(a => a.map((ad, i) => i === ai ? { ...ad, name: e.target.value } : ad))} className="flex-1" />
            <Input placeholder="Harga" type="number" value={addon.price} onChange={e => setAddons(a => a.map((ad, i) => i === ai ? { ...ad, price: Number(e.target.value) } : ad))} className="w-28" />
            <Button type="button" variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => setAddons(a => a.filter((_, i) => i !== ai))}>
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        ))}
      </div>

      <div className="flex gap-3 pt-2">
        <Button type="button" variant="outline" onClick={onSuccess}>Batal</Button>
        <Button type="submit" disabled={mutation.isPending}>
          {mutation.isPending ? 'Menyimpan...' : item ? 'Simpan Perubahan' : 'Tambah Menu'}
        </Button>
      </div>
    </form>
  )
}
