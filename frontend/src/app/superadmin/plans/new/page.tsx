'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Header } from '@/components/shared/Header'
import { Button } from '@/components/ui/button'
import { PlanForm } from '@/components/superadmin/PlanForm'
import { useCreatePlan } from '@/lib/hooks/usePlans'

export default function NewPlanPage() {
  const router = useRouter()
  const { mutate, isPending } = useCreatePlan()

  return (
    <div>
      <Header title="Tambah Subscription Plan">
        <Button variant="ghost" asChild>
          <Link href="/superadmin/plans">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Kembali
          </Link>
        </Button>
      </Header>

      <PlanForm
        onSubmit={(data) => mutate(data, { onSuccess: () => router.push('/superadmin/plans') })}
        isPending={isPending}
      />
    </div>
  )
}
