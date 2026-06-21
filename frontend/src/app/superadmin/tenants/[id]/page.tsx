'use client'

import { use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Header } from '@/components/shared/Header'
import { Button } from '@/components/ui/button'
import { TenantForm } from '@/components/superadmin/TenantForm'
import { useTenant, useUpdateTenant } from '@/lib/hooks/useTenants'
import { StoreTenantPayload } from '@/lib/api/superadmin'

export default function EditTenantPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const tenantId = parseInt(id)
  const { data, isLoading } = useTenant(tenantId)
  const { mutate, isPending } = useUpdateTenant(tenantId)

  const tenant = data?.data

  if (isLoading) {
    return <div className="text-muted-foreground">Memuat data tenant...</div>
  }

  if (!tenant) {
    return <div className="text-destructive">Tenant tidak ditemukan.</div>
  }

  return (
    <div>
      <Header title={`Edit Tenant: ${tenant.name}`} description={`slug: ${tenant.slug}`}>
        <Button variant="ghost" asChild>
          <Link href="/superadmin/tenants">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Kembali
          </Link>
        </Button>
      </Header>

      <TenantForm
        defaultValues={tenant}
        isEdit
        onSubmit={(data: StoreTenantPayload) => mutate(data, { onSuccess: () => router.push('/superadmin/tenants') })}
        isPending={isPending}
      />
    </div>
  )
}
