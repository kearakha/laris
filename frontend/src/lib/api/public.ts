import axios from 'axios'

const publicClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000/api',
  headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
})

export const publicApi = {
  getMenu: (outletSlug: string) =>
    publicClient.get(`/v1/public/menu/${outletSlug}`),
  getTableInfo: (qrToken: string) =>
    publicClient.get(`/v1/public/tables/${qrToken}`),
  placeOrder: (qrToken: string, data: {
    customer_name: string
    notes?: string
    items: Array<{
      menu_item_id: number
      quantity: number
      notes?: string
      variant_options?: number[]
      addons?: number[]
    }>
  }) =>
    publicClient.post(`/v1/public/tables/${qrToken}/orders`, data),
  getOrderStatus: (orderNumber: string) =>
    publicClient.get(`/v1/public/orders/${orderNumber}/status`),
}
