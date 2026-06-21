import { db, type OfflineOrder } from './db'
import apiClient from '@/lib/api/client'

export async function cacheMenuForOutlet(outletSlug: string, outletId: number): Promise<void> {
  try {
    const res = await apiClient.get(`/api/v1/public/menu/${outletSlug}`)
    const categories = res.data?.data?.categories ?? []

    const now = Date.now()
    const items = categories.flatMap((cat: { id: number; name: string; menu_items: Array<{ id: number; name: string; base_price: number; is_available: boolean; variants: unknown[]; addons: unknown[] }> }) =>
      (cat.menu_items ?? []).map((item) => ({
        ...item,
        outletId,
        category_id: cat.id,
        category_name: cat.name,
        cachedAt: now,
      }))
    )

    await db.offlineMenu.where('outletId').equals(outletId).delete()
    await db.offlineMenu.bulkPut(items)
  } catch {
    // Silently fail — offline sync non-critical
  }
}

export async function syncPendingOrders(outletId: number, qrToken?: string): Promise<{ synced: number; failed: number }> {
  const pending = await db.offlineOrders
    .where('outletId').equals(outletId)
    .filter(o => !o.synced)
    .toArray()

  let synced = 0
  let failed = 0

  for (const order of pending) {
    try {
      let res
      if (qrToken) {
        res = await apiClient.post(`/api/v1/public/tables/${qrToken}/orders`, {
          customer_name: order.customerName,
          notes: order.notes,
          items: order.items.map(item => ({
            menu_item_id: item.menu_item_id,
            quantity: item.quantity,
            notes: item.notes,
            variant_options: item.variant_options.map(v => v.id),
            addons: item.addons.map(a => a.id),
          })),
        })
      } else {
        res = await apiClient.post('/api/v1/outlet/orders', {
          type: order.type,
          table_id: order.tableId,
          customer_name: order.customerName,
          notes: order.notes,
          items: order.items.map(item => ({
            menu_item_id: item.menu_item_id,
            quantity: item.quantity,
            notes: item.notes,
            variant_options: item.variant_options.map(v => v.id),
            addons: item.addons.map(a => a.id),
          })),
        })
      }

      await db.offlineOrders.update(order.localId!, {
        synced: true,
        syncedOrderNumber: res.data?.data?.order_number,
        syncError: undefined,
      })
      synced++
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Network error'
      await db.offlineOrders.update(order.localId!, { syncError: msg })
      failed++
    }
  }

  return { synced, failed }
}

export async function saveOfflineOrder(order: Omit<OfflineOrder, 'localId' | 'synced' | 'createdAt'>): Promise<number> {
  return db.offlineOrders.add({
    ...order,
    synced: false,
    createdAt: Date.now(),
  })
}

export async function getPendingCount(outletId: number): Promise<number> {
  return db.offlineOrders
    .where('outletId').equals(outletId)
    .filter(o => !o.synced)
    .count()
}
