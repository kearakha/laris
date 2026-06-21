'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Minus, ShoppingCart, X, WifiOff } from 'lucide-react'
import { toast } from 'sonner'
import { menuApi, tableApi, orderApi, type MenuItem, type DiningTable, type Order } from '@/lib/api/outlet'
import { useAuthStore } from '@/lib/stores/authStore'
import { Button } from '@/components/ui/button'
import { cn, formatRupiah } from '@/lib/utils'
import { PaymentModal } from '@/components/outlet/PaymentModal'
import { useOfflineSync } from '@/lib/offline/useOfflineSync'
import { saveOfflineOrder } from '@/lib/offline/sync'

interface PosCartItem {
  cartId: string
  menu_item_id: number
  name: string
  base_price: number
  quantity: number
  notes: string
}

const formatRp = formatRupiah

export default function PosPage() {
  const { user } = useAuthStore()
  const outletId = user?.outlet?.id
  const qc = useQueryClient()

  const { isOnline, pendingCount, syncing, manualSync } = useOfflineSync(outletId)

  const [cart, setCart] = useState<PosCartItem[]>([])
  const [selectedCat, setSelectedCat] = useState<number | null>(null)
  const [selectedTableId, setSelectedTableId] = useState<number | null>(null)
  const [orderType, setOrderType] = useState<'dine_in' | 'takeaway'>('dine_in')
  const [customerName, setCustomerName] = useState('')
  const [paymentOrder, setPaymentOrder] = useState<Order | null>(null)

  const { data: catData } = useQuery({
    queryKey: ['menu-categories', outletId],
    queryFn: () => menuApi.getCategories(outletId),
  })

  const { data: itemData } = useQuery({
    queryKey: ['menu-items', outletId, selectedCat],
    queryFn: () => menuApi.getItems(selectedCat ? { category_id: selectedCat } : {}, outletId),
  })

  const { data: tableData } = useQuery({
    queryKey: ['tables', outletId],
    queryFn: () => tableApi.getTables(outletId),
  })

  const { data: ordersData } = useQuery({
    queryKey: ['pos-orders', outletId],
    queryFn: () => orderApi.getOrders({ date: new Date().toISOString().slice(0, 10) }, outletId),
    refetchInterval: 15000,
  })

  const createOrderMutation = useMutation({
    mutationFn: async () => {
      if (!isOnline) {
        if (!outletId) throw new Error('No outlet')
        const subtotal = cart.reduce((s, i) => s + i.base_price * i.quantity, 0)
        await saveOfflineOrder({
          tempId: crypto.randomUUID(),
          outletId,
          tableId: selectedTableId ?? undefined,
          customerName: customerName || 'Guest',
          type: orderType,
          items: cart.map(i => ({
            menu_item_id: i.menu_item_id,
            name: i.name,
            base_price: i.base_price,
            quantity: i.quantity,
            notes: i.notes || undefined,
            variant_options: [],
            addons: [],
          })),
          subtotal,
          total: subtotal,
          notes: undefined,
        })
        return { offline: true }
      }
      return orderApi.createOrder({
        table_id: selectedTableId,
        type: orderType,
        customer_name: customerName || undefined,
        items: cart.map(item => ({
          menu_item_id: item.menu_item_id,
          quantity: item.quantity,
          notes: item.notes || undefined,
        })),
      }, outletId)
    },
    onSuccess: (result) => {
      if ((result as { offline?: boolean })?.offline) {
        toast.warning('Offline — order tersimpan lokal, akan sync saat online')
      } else {
        qc.invalidateQueries({ queryKey: ['pos-orders'] })
        qc.invalidateQueries({ queryKey: ['tables'] })
        toast.success('Order berhasil dibuat!')
      }
      setCart([])
      setCustomerName('')
      setSelectedTableId(null)
    },
    onError: (e: { response?: { data?: { message?: string } } }) => {
      toast.error(e.response?.data?.message ?? 'Gagal membuat order')
    },
  })

  const updateStatusMutation = useMutation({
    mutationFn: ({ orderId, status }: { orderId: number; status: string }) =>
      orderApi.updateStatus(orderId, status, outletId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pos-orders'] })
      qc.invalidateQueries({ queryKey: ['tables'] })
    },
    onError: () => toast.error('Gagal update status'),
  })

  const categories = catData?.data?.data ?? []
  const items: MenuItem[] = itemData?.data?.data?.data ?? []
  const tables: DiningTable[] = tableData?.data?.data ?? []
  const orders: Order[] = ordersData?.data?.data?.data ?? []

  const addToCart = (item: MenuItem) => {
    setCart(c => {
      const existing = c.find(ci => ci.menu_item_id === item.id)
      if (existing) {
        return c.map(ci => ci.menu_item_id === item.id ? { ...ci, quantity: ci.quantity + 1 } : ci)
      }
      return [...c, {
        cartId: crypto.randomUUID(),
        menu_item_id: item.id,
        name: item.name,
        base_price: Number(item.base_price),
        quantity: 1,
        notes: '',
      }]
    })
  }

  const removeFromCart = (cartId: string) => setCart(c => c.filter(i => i.cartId !== cartId))
  const updateQty = (cartId: string, qty: number) => {
    if (qty <= 0) { removeFromCart(cartId); return }
    setCart(c => c.map(i => i.cartId === cartId ? { ...i, quantity: qty } : i))
  }

  const cartTotal = cart.reduce((s, i) => s + i.base_price * i.quantity, 0)
  const cartCount = cart.reduce((s, i) => s + i.quantity, 0)

  const STATUS_LABEL: Record<string, { label: string; color: string }> = {
    pending: { label: 'Baru', color: 'bg-amber-100 text-amber-700' },
    confirmed: { label: 'Konfirmasi', color: 'bg-blue-100 text-blue-700' },
    preparing: { label: 'Dimasak', color: 'bg-purple-100 text-purple-700' },
    ready: { label: 'Siap', color: 'bg-green-100 text-green-700' },
    served: { label: 'Disajikan', color: 'bg-green-200 text-green-800' },
    completed: { label: 'Selesai', color: 'bg-muted text-muted-foreground' },
    cancelled: { label: 'Batal', color: 'bg-red-100 text-red-700' },
  }

  return (
    <>
    {paymentOrder && (
      <PaymentModal
        order={paymentOrder}
        open={!!paymentOrder}
        onClose={() => setPaymentOrder(null)}
        onSuccess={() => {
          setPaymentOrder(null)
          qc.invalidateQueries({ queryKey: ['pos-orders'] })
          qc.invalidateQueries({ queryKey: ['tables'] })
        }}
      />
    )}
    <div className="flex flex-col h-screen overflow-hidden">
      {(!isOnline || pendingCount > 0) && (
        <div className={cn('flex items-center gap-2 px-4 py-1.5 text-xs font-medium', isOnline ? 'bg-amber-50 text-amber-700 border-b border-amber-200' : 'bg-red-50 text-red-700 border-b border-red-200')}>
          <WifiOff className="h-3.5 w-3.5 shrink-0" />
          {!isOnline ? 'Mode Offline — order akan disimpan lokal' : `${pendingCount} order pending sync`}
          {isOnline && pendingCount > 0 && (
            <button onClick={manualSync} disabled={syncing} className="ml-auto text-xs underline hover:no-underline disabled:opacity-50">
              {syncing ? 'Syncing...' : 'Sync sekarang'}
            </button>
          )}
        </div>
      )}
    <div className="flex flex-1 overflow-hidden">
      {/* Left: Menu */}
      <div className="flex-1 flex flex-col border-r overflow-hidden">
        <div className="p-3 border-b">
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            <button
              onClick={() => setSelectedCat(null)}
              className={cn('px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors', selectedCat === null ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/70 text-muted-foreground')}
            >
              Semua
            </button>
            {categories.map((cat: { id: number; name: string }) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCat(cat.id)}
                className={cn('px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors', selectedCat === cat.id ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/70 text-muted-foreground')}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-3">
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
            {items.map((item) => (
              <button
                key={item.id}
                onClick={() => item.is_available && addToCart(item)}
                disabled={!item.is_available}
                className={cn(
                  'text-left border rounded-lg p-3 transition-all hover:shadow-md',
                  item.is_available ? 'hover:border-primary cursor-pointer' : 'opacity-50 cursor-not-allowed'
                )}
              >
                <div className="text-2xl mb-1">🍽️</div>
                <p className="text-xs font-medium line-clamp-2 leading-tight">{item.name}</p>
                <p className="text-xs font-bold text-primary mt-1">{formatRp(Number(item.base_price))}</p>
                {!item.is_available && <p className="text-xs text-destructive mt-0.5">Habis</p>}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Center: Cart */}
      <div className="w-72 flex flex-col border-r overflow-hidden">
        <div className="p-3 border-b">
          <div className="flex items-center gap-2 mb-3">
            <ShoppingCart className="h-4 w-4" />
            <span className="font-semibold text-sm">Keranjang {cartCount > 0 && `(${cartCount})`}</span>
          </div>

          <div className="flex gap-1 mb-2">
            <button
              onClick={() => setOrderType('dine_in')}
              className={cn('flex-1 py-1 text-xs rounded-md font-medium transition-colors', orderType === 'dine_in' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/70 text-muted-foreground')}
            >
              Dine In
            </button>
            <button
              onClick={() => setOrderType('takeaway')}
              className={cn('flex-1 py-1 text-xs rounded-md font-medium transition-colors', orderType === 'takeaway' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/70 text-muted-foreground')}
            >
              Takeaway
            </button>
          </div>

          {orderType === 'dine_in' && (
            <select
              value={selectedTableId ?? ''}
              onChange={e => setSelectedTableId(e.target.value ? Number(e.target.value) : null)}
              className="w-full border rounded-md px-2 py-1.5 text-xs bg-background"
            >
              <option value="">Pilih meja...</option>
              {tables.filter(t => t.status === 'available' || t.id === selectedTableId).map(t => (
                <option key={t.id} value={t.id}>{t.name} ({t.status})</option>
              ))}
            </select>
          )}

          <input
            className="w-full border rounded-md px-2 py-1.5 text-xs bg-background mt-2"
            placeholder="Nama pelanggan (opsional)"
            value={customerName}
            onChange={e => setCustomerName(e.target.value)}
          />
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-2">
          {cart.length === 0 ? (
            <p className="text-xs text-center text-muted-foreground pt-8">Pilih menu dari kiri</p>
          ) : cart.map(item => (
            <div key={item.cartId} className="flex gap-2 items-center bg-muted/30 rounded-lg p-2">
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate">{item.name}</p>
                <p className="text-xs text-muted-foreground">{formatRp(item.base_price)}</p>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => updateQty(item.cartId, item.quantity - 1)} className="h-5 w-5 rounded-full bg-muted flex items-center justify-center hover:bg-muted/70">
                  <Minus className="h-2.5 w-2.5" />
                </button>
                <span className="text-xs w-4 text-center font-medium">{item.quantity}</span>
                <button onClick={() => updateQty(item.cartId, item.quantity + 1)} className="h-5 w-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90">
                  <Plus className="h-2.5 w-2.5" />
                </button>
              </div>
              <button onClick={() => removeFromCart(item.cartId)} className="text-destructive hover:text-destructive/70">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>

        {cart.length > 0 && (
          <div className="p-3 border-t space-y-2">
            <div className="flex justify-between text-sm font-semibold">
              <span>Total</span>
              <span>{formatRp(cartTotal)}</span>
            </div>
            <Button
              className="w-full"
              size="sm"
              disabled={createOrderMutation.isPending || (orderType === 'dine_in' && !selectedTableId)}
              onClick={() => createOrderMutation.mutate()}
            >
              {createOrderMutation.isPending ? 'Memproses...' : 'Buat Order'}
            </Button>
          </div>
        )}
      </div>

      {/* Right: Active Orders */}
      <div className="w-72 flex flex-col overflow-hidden">
        <div className="p-3 border-b">
          <p className="font-semibold text-sm">Order Hari Ini</p>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-2">
          {orders.filter(o => !['completed', 'cancelled'].includes(o.status)).map(order => {
            const s = STATUS_LABEL[order.status]
            return (
              <div key={order.id} className="border rounded-lg p-3 space-y-1.5">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold">{order.order_number}</span>
                  <span className={cn('text-xs px-1.5 py-0.5 rounded-full font-medium', s?.color)}>{s?.label}</span>
                </div>
                {order.table && <p className="text-xs text-muted-foreground">{order.table.name}</p>}
                <p className="text-xs font-semibold">{formatRp(Number(order.total))}</p>
                <div className="flex gap-1 flex-wrap">
                  {order.payment_status === 'unpaid' && ['served', 'ready', 'completed'].includes(order.status) && (
                    <button
                      onClick={() => setPaymentOrder(order)}
                      className="flex-1 text-xs py-1 rounded-md bg-green-600 text-white hover:bg-green-700 font-medium transition-colors"
                    >
                      Bayar
                    </button>
                  )}
                  {order.status !== 'served' && order.status !== 'completed' && order.payment_status === 'unpaid' && (
                    <button
                      onClick={() => updateStatusMutation.mutate({ orderId: order.id, status: order.status === 'ready' ? 'completed' : 'served' })}
                      className="flex-1 text-xs py-1 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 font-medium transition-colors"
                    >
                      {order.status === 'ready' ? 'Selesai' : 'Sajikan'}
                    </button>
                  )}
                  {['pending', 'confirmed'].includes(order.status) && (
                    <button
                      onClick={() => { if (confirm('Batalkan order ini?')) updateStatusMutation.mutate({ orderId: order.id, status: 'cancelled' }) }}
                      className="px-2 text-xs py-1 rounded-md border border-destructive text-destructive hover:bg-destructive/10 transition-colors"
                    >
                      Batal
                    </button>
                  )}
                </div>
              </div>
            )
          })}
          {orders.filter(o => !['completed', 'cancelled'].includes(o.status)).length === 0 && (
            <p className="text-xs text-center text-muted-foreground pt-8">Belum ada order aktif</p>
          )}
        </div>
      </div>
    </div>
    </div>
    </>
  )
}
