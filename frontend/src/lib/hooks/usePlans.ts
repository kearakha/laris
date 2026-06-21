import { superAdminApi, StorePlanPayload } from '@/lib/api/superadmin'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

export function usePlans() {
  return useQuery({
    queryKey: ['plans'],
    queryFn: () => superAdminApi.getPlans().then((r) => r.data),
  })
}

export function usePlan(id: number) {
  return useQuery({
    queryKey: ['plan', id],
    queryFn: () => superAdminApi.getPlan(id).then((r) => r.data),
    enabled: !!id,
  })
}

export function useCreatePlan() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: StorePlanPayload) => superAdminApi.createPlan(data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['plans'] })
      toast.success('Plan berhasil dibuat.')
    },
    onError: (e: { response?: { data?: { message?: string } } }) => {
      toast.error(e.response?.data?.message ?? 'Gagal membuat plan.')
    },
  })
}

export function useUpdatePlan(id: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: StorePlanPayload) => superAdminApi.updatePlan(id, data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['plans'] })
      qc.invalidateQueries({ queryKey: ['plan', id] })
      toast.success('Plan berhasil diperbarui.')
    },
    onError: (e: { response?: { data?: { message?: string } } }) => {
      toast.error(e.response?.data?.message ?? 'Gagal memperbarui plan.')
    },
  })
}

export function useDeletePlan() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => superAdminApi.deletePlan(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['plans'] })
      toast.success('Plan berhasil dihapus.')
    },
    onError: (e: { response?: { data?: { message?: string } } }) => {
      toast.error(e.response?.data?.message ?? 'Gagal menghapus plan.')
    },
  })
}
