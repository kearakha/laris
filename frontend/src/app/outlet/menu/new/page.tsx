'use client'

import { useRouter } from 'next/navigation'
import { MenuItemForm } from '@/components/outlet/MenuItemForm'

export default function NewMenuPage() {
  const router = useRouter()
  return (
    <div className="p-6 max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">Tambah Menu</h1>
      <MenuItemForm onSuccess={() => router.push('/outlet/menu')} />
    </div>
  )
}
