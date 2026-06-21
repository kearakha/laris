import Dexie, { Table } from 'dexie'

export interface OfflineOrder {
  localId?: number
  tempId: string              // UUID generated client-side
  outletId: number
  tableId?: number
  customerName: string
  notes?: string
  type: 'dine_in' | 'takeaway'
  items: Array<{
    menu_item_id: number
    name: string
    base_price: number
    quantity: number
    notes?: string
    variant_options: Array<{ id: number; label: string; price_modifier: number }>
    addons: Array<{ id: number; name: string; price: number }>
  }>
  subtotal: number
  total: number
  createdAt: number           // timestamp ms
  synced: boolean
  syncError?: string
  syncedOrderNumber?: string
}

export interface OfflineMenuItem {
  id: number
  outletId: number
  name: string
  base_price: number
  is_available: boolean
  category_id: number
  category_name: string
  image?: string
  variants: Array<{ id: number; name: string; is_required: boolean; options: Array<{ id: number; label: string; price_modifier: number }> }>
  addons: Array<{ id: number; name: string; price: number; is_available: boolean }>
  cachedAt: number
}

class LarisDatabase extends Dexie {
  offlineOrders!: Table<OfflineOrder>
  offlineMenu!: Table<OfflineMenuItem>

  constructor() {
    super('LarisOfflineDB')
    this.version(1).stores({
      offlineOrders: '++localId, tempId, outletId, synced, createdAt',
      offlineMenu: 'id, outletId, category_id, cachedAt',
    })
  }
}

export const db = new LarisDatabase()
