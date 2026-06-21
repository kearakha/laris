import { create } from 'zustand'

export interface CartItemAddon {
  id: number
  name: string
  price: number
}

export interface CartItemVariantOption {
  id: number
  label: string
  price_modifier: number
}

export interface CartItem {
  cartId: string
  menu_item_id: number
  name: string
  base_price: number
  quantity: number
  notes: string
  variant_options: CartItemVariantOption[]
  addons: CartItemAddon[]
}

function calcItemTotal(item: CartItem): number {
  const variantTotal = item.variant_options.reduce((s, v) => s + v.price_modifier, 0)
  const addonTotal = item.addons.reduce((s, a) => s + a.price, 0)
  return (item.base_price + variantTotal + addonTotal) * item.quantity
}

interface CartState {
  items: CartItem[]
  tableId: number | null
  tableQrToken: string | null
  outletSlug: string | null
  addItem: (item: Omit<CartItem, 'cartId'>) => void
  removeItem: (cartId: string) => void
  updateQty: (cartId: string, qty: number) => void
  clearCart: () => void
  setTable: (tableId: number, qrToken: string, outletSlug: string) => void
  getTotal: () => number
  getItemCount: () => number
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  tableId: null,
  tableQrToken: null,
  outletSlug: null,

  addItem: (item) => set((state) => ({
    items: [...state.items, { ...item, cartId: crypto.randomUUID() }],
  })),

  removeItem: (cartId) => set((state) => ({
    items: state.items.filter((i) => i.cartId !== cartId),
  })),

  updateQty: (cartId, qty) => set((state) => ({
    items: qty <= 0
      ? state.items.filter((i) => i.cartId !== cartId)
      : state.items.map((i) => i.cartId === cartId ? { ...i, quantity: qty } : i),
  })),

  clearCart: () => set({ items: [], tableId: null, tableQrToken: null, outletSlug: null }),

  setTable: (tableId, qrToken, outletSlug) => set({ tableId, tableQrToken: qrToken, outletSlug }),

  getTotal: () => get().items.reduce((s, item) => s + calcItemTotal(item), 0),

  getItemCount: () => get().items.reduce((s, item) => s + item.quantity, 0),
}))
