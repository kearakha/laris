'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Header } from '@/components/shared/Header'
import { Button } from '@/components/ui/button'
import { TenantForm } from '@/components/superadmin/TenantForm'
import { useCreateTenant } from '@/lib/hooks/useTenants'

export default function NewTenantPage() {
  const router = useRouter()
  const { mutate, isPending } = useCreateTenant()

  return (
    <div>
      <Header title="Tambah Tenant Baru">
        <Button variant="ghost" asChild>
          <Link href="/superadmin/tenants">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Kembali
          </Link>
        </Button>
      </Header>

      <TenantForm
        onSubmit={(data) => mutate(data, { onSuccess: () => router.push('/superadmin/tenants') })}
        isPending={isPending}
      />
    </div>
  )
}
