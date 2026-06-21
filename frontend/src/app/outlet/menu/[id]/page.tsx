'use client'

import { useRouter, useParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { menuApi } from '@/lib/api/outlet'
import { useAuthStore } from '@/lib/stores/authStore'
import { MenuItemForm } from '@/components/outlet/MenuItemForm'

export default function EditMenuPage() {
  const router = useRouter()
  const params = useParams()
  const id = Number(params.id)
  const { user } = useAuthStore()
  const outletId = user?.outlet?.id

  const { data, isLoading } = useQuery({
    queryKey: ['menu-item', id],
    queryFn: () => menuApi.getItem(id, outletId),
  })

  if (isLoading) return <div className="p-6 text-sm text-muted-foreground">Memuat...</div>

  const item = data?.data?.data
  if (!item) return <div className="p-6 text-sm text-destructive">Menu tidak ditemukan.</div>

  return (
    <div className="p-6 max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">Edit Menu</h1>
      <MenuItemForm item={item} onSuccess={() => router.push('/outlet/menu')} />
    </div>
  )
}
