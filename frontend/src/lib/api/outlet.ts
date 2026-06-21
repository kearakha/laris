import { apiClient } from './client'

export interface MenuCategory {
  id: number
  tenant_id: number
  outlet_id: number | null
  name: string
  image: string | null
  sort_order: number
  is_active: boolean
  menu_items_count?: number
  menu_items?: MenuItem[]
}

export interface MenuItemVariantOption {
  id: number
  variant_id: number
  label: string
  price_modifier: string
  is_default: boolean
  sort_order: number
}

export interface MenuItemVariant {
  id: number
  menu_item_id: number
  name: string
  is_required: boolean
  options: MenuItemVariantOption[]
}

export interface MenuItemAddon {
  id: number
  menu_item_id: number
  name: string
  price: string
  is_available: boolean
}

export interface MenuItemTag {
  id: number
  tag: string
}

export interface MenuItem {
  id: number
  tenant_id: number
  outlet_id: number | null
  category_id: number
  name: string
  slug: string
  description: string | null
  image: string | null
  base_price: string
  is_available: boolean
  is_featured: boolean
  preparation_time: number
  sort_order: number
  category?: MenuCategory
  variants: MenuItemVariant[]
  addons: MenuItemAddon[]
  tags: MenuItemTag[]
}

export interface DiningTable {
  id: number
  outlet_id: number
  tenant_id: number
  name: string
  capacity: number
  qr_code: string
  status: 'available' | 'occupied' | 'reserved'
  orders_count?: number
}

export interface OrderItem {
  id: number
  order_id: number
  menu_item_id: number
  menu_item_name: string
  menu_item_price: string
  quantity: number
  subtotal: string
  notes: string | null
  status: 'pending' | 'preparing' | 'ready' | 'served' | 'cancelled'
  variant_options?: Array<{ label: string; price_modifier: string }>
  addons?: Array<{ name: string; price: string; quantity: number }>
}

export interface Order {
  id: number
  tenant_id: number
  outlet_id: number
  table_id: number | null
  order_number: string
  type: 'dine_in' | 'takeaway' | 'delivery'
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'served' | 'completed' | 'cancelled'
  payment_status: 'unpaid' | 'partial' | 'paid' | 'refunded'
  notes: string | null
  customer_name: string | null
  subtotal: string
  tax_amount: string
  service_charge_amount: string
  total: string
  created_at: string
  updated_at: string
  table?: DiningTable
  items: OrderItem[]
  created_by?: { id: number; name: string }
}

function getOutletHeaders(outletId?: number) {
  return outletId ? { 'X-Outlet-Id': String(outletId) } : {}
}

export const menuApi = {
  // Categories
  getCategories: (outletId?: number) =>
    apiClient.get('/v1/outlet/menu/categories', { headers: getOutletHeaders(outletId) }),
  createCategory: (data: Partial<MenuCategory>, outletId?: number) =>
    apiClient.post('/v1/outlet/menu/categories', data, { headers: getOutletHeaders(outletId) }),
  updateCategory: (id: number, data: Partial<MenuCategory>, outletId?: number) =>
    apiClient.put(`/v1/outlet/menu/categories/${id}`, data, { headers: getOutletHeaders(outletId) }),
  deleteCategory: (id: number, outletId?: number) =>
    apiClient.delete(`/v1/outlet/menu/categories/${id}`, { headers: getOutletHeaders(outletId) }),
  reorderCategories: (items: Array<{ id: number; sort_order: number }>, outletId?: number) =>
    apiClient.put('/v1/outlet/menu/categories/reorder', { items }, { headers: getOutletHeaders(outletId) }),

  // Items
  getItems: (params?: Record<string, string | number | boolean>, outletId?: number) =>
    apiClient.get('/v1/outlet/menu/items', { params, headers: getOutletHeaders(outletId) }),
  createItem: (data: Record<string, unknown>, outletId?: number) =>
    apiClient.post('/v1/outlet/menu/items', data, { headers: getOutletHeaders(outletId) }),
  getItem: (id: number, outletId?: number) =>
    apiClient.get(`/v1/outlet/menu/items/${id}`, { headers: getOutletHeaders(outletId) }),
  updateItem: (id: number, data: Record<string, unknown>, outletId?: number) =>
    apiClient.put(`/v1/outlet/menu/items/${id}`, data, { headers: getOutletHeaders(outletId) }),
  deleteItem: (id: number, outletId?: number) =>
    apiClient.delete(`/v1/outlet/menu/items/${id}`, { headers: getOutletHeaders(outletId) }),
  toggleAvailability: (id: number, outletId?: number) =>
    apiClient.patch(`/v1/outlet/menu/items/${id}/availability`, {}, { headers: getOutletHeaders(outletId) }),
}

export const tableApi = {
  getTables: (outletId?: number) =>
    apiClient.get('/v1/outlet/tables', { headers: getOutletHeaders(outletId) }),
  createTable: (data: { name: string; capacity?: number }, outletId?: number) =>
    apiClient.post('/v1/outlet/tables', data, { headers: getOutletHeaders(outletId) }),
  updateTable: (id: number, data: { name: string; capacity?: number }, outletId?: number) =>
    apiClient.put(`/v1/outlet/tables/${id}`, data, { headers: getOutletHeaders(outletId) }),
  deleteTable: (id: number, outletId?: number) =>
    apiClient.delete(`/v1/outlet/tables/${id}`, { headers: getOutletHeaders(outletId) }),
}

export const orderApi = {
  getOrders: (params?: Record<string, string | number>, outletId?: number) =>
    apiClient.get('/v1/outlet/orders', { params, headers: getOutletHeaders(outletId) }),
  createOrder: (data: unknown, outletId?: number) =>
    apiClient.post('/v1/outlet/orders', data, { headers: getOutletHeaders(outletId) }),
  getOrder: (id: number, outletId?: number) =>
    apiClient.get(`/v1/outlet/orders/${id}`, { headers: getOutletHeaders(outletId) }),
  updateStatus: (id: number, status: string, outletId?: number) =>
    apiClient.patch(`/v1/outlet/orders/${id}/status`, { status }, { headers: getOutletHeaders(outletId) }),
  updateItemStatus: (orderId: number, itemId: number, status: string, outletId?: number) =>
    apiClient.patch(`/v1/outlet/orders/${orderId}/items/${itemId}/status`, { status }, { headers: getOutletHeaders(outletId) }),
  cancelOrder: (id: number, reason?: string, outletId?: number) =>
    apiClient.post(`/v1/outlet/orders/${id}/cancel`, { reason }, { headers: getOutletHeaders(outletId) }),
  getPayments: (orderId: number, outletId?: number) =>
    apiClient.get(`/v1/outlet/orders/${orderId}/payments`, { headers: getOutletHeaders(outletId) }),
  processPayment: (orderId: number, data: { method: string; amount_paid?: number }, outletId?: number) =>
    apiClient.post(`/v1/outlet/orders/${orderId}/payments`, data, { headers: getOutletHeaders(outletId) }),
  applyVoucher: (orderId: number, code: string, outletId?: number) =>
    apiClient.post(`/v1/outlet/orders/${orderId}/apply-voucher`, { code }, { headers: getOutletHeaders(outletId) }),
  validateVoucher: (code: string, orderTotal: number, outletId?: number) =>
    apiClient.post('/v1/outlet/vouchers/validate', { code, order_total: orderTotal }, { headers: getOutletHeaders(outletId) }),
}

// Types for Phase 3
export interface Payment {
  id: number
  order_id: number
  method: 'cash' | 'qris' | 'transfer' | 'card' | 'loyalty_points'
  amount: string
  change_amount: string
  gateway: string | null
  gateway_ref: string | null
  status: 'pending' | 'success' | 'failed' | 'refunded'
  paid_at: string | null
}

export interface Voucher {
  id: number
  code: string
  name: string
  type: 'percentage' | 'fixed' | 'free_item'
  value: string
  min_order_amount: string
  max_discount_amount: string | null
  max_uses: number | null
  used_count: number
  is_active: boolean
  valid_from: string | null
  valid_until: string | null
}

export const voucherApi = {
  getVouchers: (outletId?: number) =>
    apiClient.get('/v1/outlet/vouchers', { headers: getOutletHeaders(outletId) }),
  createVoucher: (data: Partial<Voucher>, outletId?: number) =>
    apiClient.post('/v1/outlet/vouchers', data, { headers: getOutletHeaders(outletId) }),
  updateVoucher: (id: number, data: Partial<Voucher>, outletId?: number) =>
    apiClient.put(`/v1/outlet/vouchers/${id}`, data, { headers: getOutletHeaders(outletId) }),
  deleteVoucher: (id: number, outletId?: number) =>
    apiClient.delete(`/v1/outlet/vouchers/${id}`, { headers: getOutletHeaders(outletId) }),
}

// Inventory types
export interface Ingredient {
  id: number
  name: string
  unit: string
  current_stock: string
  min_stock: string
  cost_per_unit: string
  is_low_stock?: boolean
}

export interface Supplier {
  id: number
  name: string
  contact_name: string | null
  phone: string | null
  email: string | null
  address: string | null
  is_active: boolean
}

export interface PurchaseOrderItem {
  id: number
  ingredient_id: number
  quantity_ordered: string
  quantity_received: string
  unit_price: string
  subtotal: string
  ingredient?: Ingredient
}

export interface PurchaseOrder {
  id: number
  po_number: string
  supplier_id: number
  status: 'draft' | 'sent' | 'partial' | 'received' | 'cancelled'
  notes: string | null
  total_amount: string
  ordered_at: string | null
  received_at: string | null
  supplier?: Supplier
  items?: PurchaseOrderItem[]
}

export const inventoryApi = {
  getIngredients: (params?: Record<string, string | boolean>, outletId?: number) =>
    apiClient.get('/v1/outlet/inventory/ingredients', { params, headers: getOutletHeaders(outletId) }),
  createIngredient: (data: Partial<Ingredient>, outletId?: number) =>
    apiClient.post('/v1/outlet/inventory/ingredients', data, { headers: getOutletHeaders(outletId) }),
  updateIngredient: (id: number, data: Partial<Ingredient>, outletId?: number) =>
    apiClient.put(`/v1/outlet/inventory/ingredients/${id}`, data, { headers: getOutletHeaders(outletId) }),
  deleteIngredient: (id: number, outletId?: number) =>
    apiClient.delete(`/v1/outlet/inventory/ingredients/${id}`, { headers: getOutletHeaders(outletId) }),
  adjustStock: (id: number, data: { type: string; quantity: number; notes?: string }, outletId?: number) =>
    apiClient.post(`/v1/outlet/inventory/ingredients/${id}/adjustment`, data, { headers: getOutletHeaders(outletId) }),
  getMovements: (id: number, outletId?: number) =>
    apiClient.get(`/v1/outlet/inventory/ingredients/${id}/movements`, { headers: getOutletHeaders(outletId) }),

  getSuppliers: (outletId?: number) =>
    apiClient.get('/v1/outlet/inventory/suppliers', { headers: getOutletHeaders(outletId) }),
  createSupplier: (data: Partial<Supplier>, outletId?: number) =>
    apiClient.post('/v1/outlet/inventory/suppliers', data, { headers: getOutletHeaders(outletId) }),
  updateSupplier: (id: number, data: Partial<Supplier>, outletId?: number) =>
    apiClient.put(`/v1/outlet/inventory/suppliers/${id}`, data, { headers: getOutletHeaders(outletId) }),

  getPurchaseOrders: (params?: Record<string, string>, outletId?: number) =>
    apiClient.get('/v1/outlet/inventory/purchase-orders', { params, headers: getOutletHeaders(outletId) }),
  createPurchaseOrder: (data: Record<string, unknown>, outletId?: number) =>
    apiClient.post('/v1/outlet/inventory/purchase-orders', data, { headers: getOutletHeaders(outletId) }),
  getPurchaseOrder: (id: number, outletId?: number) =>
    apiClient.get(`/v1/outlet/inventory/purchase-orders/${id}`, { headers: getOutletHeaders(outletId) }),
  receivePurchaseOrder: (id: number, items: Array<{ ingredient_id: number; quantity_received: number }>, outletId?: number) =>
    apiClient.post(`/v1/outlet/inventory/purchase-orders/${id}/receive`, { items }, { headers: getOutletHeaders(outletId) }),
  updatePurchaseOrderStatus: (id: number, status: string, outletId?: number) =>
    apiClient.patch(`/v1/outlet/inventory/purchase-orders/${id}/status`, { status }, { headers: getOutletHeaders(outletId) }),
}
