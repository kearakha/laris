export interface ApiResponse<T = unknown> {
  success: boolean
  message: string
  data: T
  errors?: Record<string, string[]>
}

export interface PaginatedResponse<T = unknown> {
  success: boolean
  message: string
  data: T[]
  meta: {
    current_page: number
    last_page: number
    per_page: number
    total: number
  }
}

export interface User {
  id: number
  name: string
  email: string
  phone: string | null
  avatar: string | null
  is_active: boolean
  last_login_at: string | null
  roles: string[]
  permissions: string[]
  tenant: Tenant | null
  outlet: OutletBasic | null
}

export interface Tenant {
  id: number
  name: string
  slug: string
  email: string
  phone: string | null
  logo: string | null
  primary_color: string
  subscription_plan_id: number | null
  subscription_status: 'active' | 'trial' | 'cancelled' | 'expired'
  trial_ends_at: string | null
  created_at: string
  updated_at: string
  deleted_at: string | null
  outlets_count?: number
  subscription_plan?: SubscriptionPlan | null
}

export interface SubscriptionPlan {
  id: number
  name: string
  price_monthly: string
  price_yearly: string
  max_outlets: number
  max_users: number
  features: string[] | null
  is_active: boolean
  created_at: string
  tenants_count?: number
}

export interface OutletBasic {
  id: number
  name: string
  slug: string
  is_central_kitchen?: boolean
}
