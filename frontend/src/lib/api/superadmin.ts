import { ApiResponse, PaginatedResponse, SubscriptionPlan, Tenant } from '@/lib/types'
import apiClient from './client'

export interface TenantFilters {
  search?: string
  status?: string
  page?: number
  per_page?: number
  trashed?: boolean
}

export interface StoreTenantPayload {
  name: string
  slug: string
  email: string
  phone?: string
  primary_color?: string
  subscription_plan_id?: number
  subscription_status?: string
  trial_ends_at?: string
  owner_name: string
  owner_email: string
  owner_password: string
  owner_phone?: string
}

export interface StorePlanPayload {
  name: string
  price_monthly: number
  price_yearly: number
  max_outlets: number
  max_users: number
  features?: string[]
  is_active?: boolean
}

export const superAdminApi = {
  // Tenants
  getTenants: (params?: TenantFilters) =>
    apiClient.get<PaginatedResponse<Tenant>>('/v1/super-admin/tenants', { params }),

  getTenant: (id: number) =>
    apiClient.get<ApiResponse<Tenant>>(`/v1/super-admin/tenants/${id}`),

  createTenant: (data: StoreTenantPayload) =>
    apiClient.post<ApiResponse<Tenant>>('/v1/super-admin/tenants', data),

  updateTenant: (id: number, data: Partial<StoreTenantPayload>) =>
    apiClient.put<ApiResponse<Tenant>>(`/v1/super-admin/tenants/${id}`, data),

  deleteTenant: (id: number) =>
    apiClient.delete<ApiResponse<null>>(`/v1/super-admin/tenants/${id}`),

  restoreTenant: (id: number) =>
    apiClient.post<ApiResponse<Tenant>>(`/v1/super-admin/tenants/${id}/restore`),

  // Subscription Plans
  getPlans: () =>
    apiClient.get<ApiResponse<SubscriptionPlan[]>>('/v1/super-admin/subscription-plans'),

  getPlan: (id: number) =>
    apiClient.get<ApiResponse<SubscriptionPlan>>(`/v1/super-admin/subscription-plans/${id}`),

  createPlan: (data: StorePlanPayload) =>
    apiClient.post<ApiResponse<SubscriptionPlan>>('/v1/super-admin/subscription-plans', data),

  updatePlan: (id: number, data: StorePlanPayload) =>
    apiClient.put<ApiResponse<SubscriptionPlan>>(`/v1/super-admin/subscription-plans/${id}`, data),

  deletePlan: (id: number) =>
    apiClient.delete<ApiResponse<null>>(`/v1/super-admin/subscription-plans/${id}`),
}
