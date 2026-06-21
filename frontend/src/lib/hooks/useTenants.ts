import { superAdminApi, TenantFilters, StoreTenantPayload } from '@/lib/api/superadmin'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

export function useTenants(filters?: TenantFilters) {
  return useQuery({
    queryKey: ['tenants', filters],
    queryFn: () => superAdminApi.getTenants(filters).then((r) => r.data),
  })
}

export function useTenant(id: number) {
  return useQuery({
    queryKey: ['tenant', id],
    queryFn: () => superAdminApi.getTenant(id).then((r) => r.data),
    enabled: !!id,
  })
}

export function useCreateTenant() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: StoreTenantPayload) => superAdminApi.createTenant(data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tenants'] })
      toast.success('Tenant berhasil dibuat.')
    },
    onError: (e: { response?: { data?: { message?: string } } }) => {
      toast.error(e.response?.data?.message ?? 'Gagal membuat tenant.')
    },
  })
}

export function useUpdateTenant(id: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Partial<StoreTenantPayload>) => superAdminApi.updateTenant(id, data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tenants'] })
      qc.invalidateQueries({ queryKey: ['tenant', id] })
      toast.success('Tenant berhasil diperbarui.')
    },
    onError: (e: { response?: { data?: { message?: string } } }) => {
      toast.error(e.response?.data?.message ?? 'Gagal memperbarui tenant.')
    },
  })
}

export function useDeleteTenant() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => superAdminApi.deleteTenant(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tenants'] })
      toast.success('Tenant berhasil dihapus.')
    },
  })
}

export function useRestoreTenant() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => superAdminApi.restoreTenant(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tenants'] })
      toast.success('Tenant berhasil dipulihkan.')
    },
  })
}
