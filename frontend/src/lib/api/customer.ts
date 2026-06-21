import axios from 'axios'

// Separate axios instance for customer — uses customer token, no staff redirect on 401
const customerClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
})

customerClient.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('laris_customer_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
  }
  return config
})

export interface Customer {
  id: number
  name: string
  email: string | null
  phone: string | null
  loyalty_points: number
  loyalty_tier: 'bronze' | 'silver' | 'gold' | 'platinum'
  date_of_birth: string | null
  gender: string | null
}

export interface LoyaltyBalance {
  points: number
  tier: string
  redeem_value: number
  next_tier: { tier: string | null; points_needed: number }
}

export interface LoyaltyTransaction {
  id: number
  type: string
  points: number
  description: string | null
  created_at: string
}

export interface Reservation {
  id: number
  outlet_id: number
  guest_name: string
  guest_phone: string
  party_size: number
  date: string
  time: string
  status: string
  notes: string | null
  outlet?: { id: number; name: string }
  table?: { id: number; name: string } | null
  created_at: string
}

export interface Review {
  id: number
  overall_rating: number
  food_rating: number | null
  service_rating: number | null
  comment: string | null
  reviewer_name: string | null
  outlet?: { id: number; name: string }
  created_at: string
}

export const customerAuthApi = {
  register: (data: { name: string; email?: string; phone?: string; password: string }) =>
    customerClient.post('/api/v1/customer/register', data),

  login: (data: { login: string; password: string }) =>
    customerClient.post('/api/v1/customer/login', data),

  logout: () =>
    customerClient.post('/api/v1/customer/logout'),

  profile: () =>
    customerClient.get('/api/v1/customer/profile'),

  updateProfile: (data: Partial<Customer>) =>
    customerClient.put('/api/v1/customer/profile', data),
}

export const customerLoyaltyApi = {
  getBalance: () =>
    customerClient.get('/api/v1/customer/loyalty/balance'),

  getHistory: () =>
    customerClient.get('/api/v1/customer/loyalty/history'),
}

export const customerReservationApi = {
  list: () =>
    customerClient.get('/api/v1/customer/reservations'),

  create: (data: { outlet_id: number; date: string; time: string; party_size: number; notes?: string }) =>
    customerClient.post('/api/v1/customer/reservations', data),

  cancel: (id: number) =>
    customerClient.post(`/api/v1/customer/reservations/${id}/cancel`),
}

export const customerReviewApi = {
  myReviews: () =>
    customerClient.get('/api/v1/customer/reviews'),

  create: (data: {
    order_id: number
    overall_rating: number
    food_rating?: number
    service_rating?: number
    ambiance_rating?: number
    comment?: string
    item_ratings?: Array<{ menu_item_id: number; rating: number }>
  }) => customerClient.post('/api/v1/customer/reviews', data),
}

export const publicReviewApi = {
  submitForOrder: (orderNumber: string, data: {
    overall_rating: number
    food_rating?: number
    service_rating?: number
    comment?: string
    reviewer_name?: string
  }) => customerClient.post(`/api/v1/public/orders/${orderNumber}/review`, data),
}

export default customerClient
