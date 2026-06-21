'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQuery, useMutation } from '@tanstack/react-query'
import { ShoppingCart, Plus, Minus, X, ChevronDown, ChevronUp, Languages } from 'lucide-react'
import { toast } from 'sonner'
import { publicApi } from '@/lib/api/public'
import { useCartStore, type CartItem } from '@/lib/stores/cartStore'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { MenuCategory, MenuItem, MenuItemVariantOption, MenuItemAddon } from '@/lib/api/outlet'

function formatRp(amount: number) {
  return `Rp ${amount.toLocaleString('id-ID')}`
}

interface ItemPickerState {
  item: MenuItem
  qty: number
  notes: string
  selectedOptions: Record<number, number>
  selectedAddons: number[]
}

export default function QrOrderPage() {
  const params = useParams()
  const router = useRouter()
  const token = params.token as string
  const { items, addItem, removeItem, updateQty, getTotal, getItemCount, setTable, clearCart } = useCartStore()
  const [picker, setPicker] = useState<ItemPickerState | null>(null)
  const [showCart, setShowCart] = useState(false)
  const [customerName, setCustomerName] = useState('')
  const [notes, setNotes] = useState('')
  const [expandedCat, setExpandedCat] = useState<number | null>(null)
  const [lang, setLang] = useState<'id' | 'en'>('id')

  const { data: tableData, isLoading: tableLoading } = useQuery({
    queryKey: ['table-info', token],
    queryFn: () => publicApi.getTableInfo(token),
  })

  const { data: menuData, isLoading: menuLoading } = useQuery({
    queryKey: ['public-menu', tableData?.data?.data?.outlet?.slug],
    queryFn: () => publicApi.getMenu(tableData!.data.data.outlet.slug),
    enabled: !!tableData?.data?.data?.outlet?.slug,
  })

  useEffect(() => {
    if (tableData?.data?.data) {
      const { table, outlet } = tableData.data.data
      setTable(table.id, token, outlet.slug)
    }
  }, [tableData, token, setTable])

  const orderMutation = useMutation({
    mutationFn: () => publicApi.placeOrder(token, {
      customer_name: customerName,
      notes,
      items: items.map(item => ({
        menu_item_id: item.menu_item_id,
        quantity: item.quantity,
        notes: item.notes || undefined,
        variant_options: item.variant_options.map(v => v.id),
        addons: item.addons.map(a => a.id),
      })),
    }),
    onSuccess: ({ data }) => {
      const orderNumber = data.data.order_number
      clearCart()
      router.push(`/order/${token}/status/${orderNumber}`)
    },
    onError: (e: { response?: { data?: { message?: string } } }) => {
      toast.error(e.response?.data?.message ?? 'Gagal membuat order')
    },
  })

  const openPicker = (item: MenuItem) => {
    const defaultOptions: Record<number, number> = {}
    item.variants?.forEach(v => {
      const def = v.options.find(o => o.is_default)
      if (def) defaultOptions[v.id] = def.id
    })
    setPicker({ item, qty: 1, notes: '', selectedOptions: defaultOptions, selectedAddons: [] })
  }

  const addToCart = () => {
    if (!picker) return
    const variantOptions = Object.values(picker.selectedOptions).map(optId => {
      const opt = picker.item.variants.flatMap(v => v.options).find(o => o.id === optId)!
      return { id: opt.id, label: opt.label, price_modifier: Number(opt.price_modifier) }
    })
    const addonItems = picker.selectedAddons.map(addonId => {
      const a = picker.item.addons.find(ad => ad.id === addonId)!
      return { id: a.id, name: a.name, price: Number(a.price) }
    })
    addItem({
      menu_item_id: picker.item.id,
      name: picker.item.name,
      base_price: Number(picker.item.base_price),
      quantity: picker.qty,
      notes: picker.notes,
      variant_options: variantOptions,
      addons: addonItems,
    })
    setPicker(null)
    toast.success(`${picker.item.name} ditambahkan ke keranjang`)
  }

  if (tableLoading || menuLoading) {
    return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Memuat menu...</div>
  }

  const outlet = tableData?.data?.data?.outlet
  const tableName = tableData?.data?.data?.table?.name
  const categories: MenuCategory[] = menuData?.data?.data?.categories ?? []

  return (
    <div className="min-h-screen bg-muted/30 pb-32">
      {/* Header */}
      <div className="bg-primary text-primary-foreground p-4 sticky top-0 z-10">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <div>
            <div className="font-bold text-lg">{outlet?.name ?? 'Laris'}</div>
            <div className="text-sm opacity-80">{tableName}</div>
          </div>
          <button
            onClick={() => setLang(l => l === 'id' ? 'en' : 'id')}
            className="flex items-center gap-1 text-xs opacity-80 hover:opacity-100 px-2 py-1 rounded border border-white/30"
          >
            <Languages className="h-3.5 w-3.5" />
            {lang === 'id' ? 'EN' : 'ID'}
          </button>
        </div>
      </div>

      <div className="max-w-lg mx-auto p-4 space-y-4">
        {categories.map((cat) => (
          <div key={cat.id} className="bg-card rounded-xl overflow-hidden shadow-sm">
            <button
              className="w-full flex items-center justify-between p-4 font-semibold text-left hover:bg-muted/50 transition-colors"
              onClick={() => setExpandedCat(expandedCat === cat.id ? null : cat.id)}
            >
              <span>{(lang === 'en' && (cat as { name_en?: string }).name_en) ? (cat as { name_en?: string }).name_en : cat.name}</span>
              {expandedCat === cat.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
            {(expandedCat === cat.id || expandedCat === null) && (
              <div className="divide-y">
                {cat.menu_items?.map((item) => (
                  <div key={item.id} className="flex gap-3 p-4">
                    {item.image ? (
                      <img src={item.image} alt={item.name} className="h-16 w-16 rounded-lg object-cover shrink-0" />
                    ) : (
                      <div className="h-16 w-16 rounded-lg bg-muted flex items-center justify-center text-2xl shrink-0">🍽️</div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium">
                        {(lang === 'en' && (item as { name_en?: string }).name_en) ? (item as { name_en?: string }).name_en : item.name}
                      </p>
                      {(lang === 'en' && (item as { description_en?: string }).description_en
                        ? (item as { description_en?: string }).description_en
                        : item.description) && (
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                          {lang === 'en' && (item as { description_en?: string }).description_en
                            ? (item as { description_en?: string }).description_en
                            : item.description}
                        </p>
                      )}
                      <p className="text-sm font-semibold text-primary mt-1">{formatRp(Number(item.base_price))}</p>
                    </div>
                    <button
                      onClick={() => openPicker(item)}
                      className="self-end bg-primary text-primary-foreground rounded-full h-8 w-8 flex items-center justify-center hover:bg-primary/90 transition-colors shrink-0"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Cart Button */}
      {getItemCount() > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-20 max-w-lg w-full px-4">
          <Button
            className="w-full py-4 text-base shadow-lg"
            onClick={() => setShowCart(true)}
          >
            <ShoppingCart className="h-5 w-5 mr-2" />
            Lihat Keranjang ({getItemCount()}) — {formatRp(getTotal())}
          </Button>
        </div>
      )}

      {/* Item Picker Modal */}
      {picker && (
        <div className="fixed inset-0 bg-black/50 flex items-end z-30" onClick={() => setPicker(null)}>
          <div className="bg-card w-full max-w-lg mx-auto rounded-t-2xl p-5 max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="font-bold text-lg">{picker.item.name}</h3>
                <p className="text-primary font-semibold">{formatRp(Number(picker.item.base_price))}</p>
              </div>
              <button onClick={() => setPicker(null)}><X className="h-5 w-5 text-muted-foreground" /></button>
            </div>

            {picker.item.variants?.map(variant => (
              <div key={variant.id} className="mb-4">
                <p className="font-medium mb-2 text-sm">{variant.name} {variant.is_required && <span className="text-destructive">*</span>}</p>
                <div className="space-y-1">
                  {variant.options.map(opt => (
                    <label key={opt.id} className="flex items-center justify-between p-2 border rounded-lg cursor-pointer hover:bg-muted/50">
                      <div className="flex items-center gap-2">
                        <input
                          type="radio"
                          name={`variant-${variant.id}`}
                          checked={picker.selectedOptions[variant.id] === opt.id}
                          onChange={() => setPicker(p => p ? { ...p, selectedOptions: { ...p.selectedOptions, [variant.id]: opt.id } } : p)}
                        />
                        <span className="text-sm">{opt.label}</span>
                      </div>
                      {Number(opt.price_modifier) > 0 && <span className="text-xs text-muted-foreground">+{formatRp(Number(opt.price_modifier))}</span>}
                    </label>
                  ))}
                </div>
              </div>
            ))}

            {picker.item.addons && picker.item.addons.length > 0 && (
              <div className="mb-4">
                <p className="font-medium mb-2 text-sm">Add-on (opsional)</p>
                <div className="space-y-1">
                  {picker.item.addons.filter(a => a.is_available).map(addon => (
                    <label key={addon.id} className="flex items-center justify-between p-2 border rounded-lg cursor-pointer hover:bg-muted/50">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={picker.selectedAddons.includes(addon.id)}
                          onChange={e => setPicker(p => p ? { ...p, selectedAddons: e.target.checked ? [...p.selectedAddons, addon.id] : p.selectedAddons.filter(id => id !== addon.id) } : p)}
                        />
                        <span className="text-sm">{addon.name}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">+{formatRp(Number(addon.price))}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            <div className="mb-4">
              <p className="font-medium mb-1 text-sm">Catatan (opsional)</p>
              <input
                className="w-full border rounded-lg px-3 py-2 text-sm bg-background"
                placeholder="Misal: tanpa bawang, extra pedas..."
                value={picker.notes}
                onChange={e => setPicker(p => p ? { ...p, notes: e.target.value } : p)}
              />
            </div>

            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <button onClick={() => setPicker(p => p ? { ...p, qty: Math.max(1, p.qty - 1) } : p)} className="h-8 w-8 rounded-full border flex items-center justify-center hover:bg-muted">
                  <Minus className="h-4 w-4" />
                </button>
                <span className="font-semibold w-6 text-center">{picker.qty}</span>
                <button onClick={() => setPicker(p => p ? { ...p, qty: p.qty + 1 } : p)} className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90">
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              <Button onClick={addToCart} className="px-6">
                Tambah — {formatRp(Number(picker.item.base_price) * picker.qty)}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Cart Sheet */}
      {showCart && (
        <div className="fixed inset-0 bg-black/50 flex items-end z-30" onClick={() => setShowCart(false)}>
          <div className="bg-card w-full max-w-lg mx-auto rounded-t-2xl p-5 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg">Keranjang</h3>
              <button onClick={() => setShowCart(false)}><X className="h-5 w-5 text-muted-foreground" /></button>
            </div>

            <div className="space-y-3 mb-4">
              {items.map((item: CartItem) => (
                <div key={item.cartId} className="flex gap-3 items-start">
                  <div className="flex-1">
                    <p className="font-medium text-sm">{item.name}</p>
                    {item.variant_options.length > 0 && (
                      <p className="text-xs text-muted-foreground">{item.variant_options.map(v => v.label).join(', ')}</p>
                    )}
                    {item.addons.length > 0 && (
                      <p className="text-xs text-muted-foreground">+{item.addons.map(a => a.name).join(', ')}</p>
                    )}
                    {item.notes && <p className="text-xs italic text-muted-foreground">{item.notes}</p>}
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => updateQty(item.cartId, item.quantity - 1)} className="h-6 w-6 rounded-full border flex items-center justify-center text-xs hover:bg-muted">
                      <Minus className="h-3 w-3" />
                    </button>
                    <span className="text-sm w-4 text-center">{item.quantity}</span>
                    <button onClick={() => updateQty(item.cartId, item.quantity + 1)} className="h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90">
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">{formatRp((item.base_price + item.variant_options.reduce((s, v) => s + v.price_modifier, 0) + item.addons.reduce((s, a) => s + a.price, 0)) * item.quantity)}</p>
                    <button onClick={() => removeItem(item.cartId)} className="text-xs text-destructive hover:underline">Hapus</button>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t pt-4 mb-4">
              <div className="flex justify-between font-bold">
                <span>Total</span>
                <span>{formatRp(getTotal())}</span>
              </div>
            </div>

            <div className="space-y-3 mb-4">
              <div>
                <label className="text-sm font-medium block mb-1">Nama Pemesan <span className="text-destructive">*</span></label>
                <input
                  className="w-full border rounded-lg px-3 py-2 text-sm bg-background"
                  placeholder="Nama kamu..."
                  value={customerName}
                  onChange={e => setCustomerName(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium block mb-1">Catatan Order (opsional)</label>
                <input
                  className="w-full border rounded-lg px-3 py-2 text-sm bg-background"
                  placeholder="Catatan untuk dapur..."
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                />
              </div>
            </div>

            <Button
              className="w-full py-3"
              disabled={!customerName || orderMutation.isPending}
              onClick={() => orderMutation.mutate()}
            >
              {orderMutation.isPending ? 'Memproses...' : 'Pesan Sekarang'}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
