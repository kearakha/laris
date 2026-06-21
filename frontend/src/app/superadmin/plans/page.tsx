'use client'

import Link from 'next/link'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { Header } from '@/components/shared/Header'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { usePlans, useDeletePlan } from '@/lib/hooks/usePlans'

const formatRupiah = (val: string) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(parseFloat(val))

export default function PlansPage() {
  const { data, isLoading } = usePlans()
  const { mutate: deletePlan } = useDeletePlan()

  const plans = data?.data ?? []

  return (
    <div>
      <Header title="Subscription Plans" description="Kelola paket langganan LARIS">
        <Button asChild>
          <Link href="/superadmin/plans/new">
            <Plus className="h-4 w-4 mr-2" />
            Tambah Plan
          </Link>
        </Button>
      </Header>

      {isLoading ? (
        <div className="text-muted-foreground">Memuat...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <Card key={plan.id} className={!plan.is_active ? 'opacity-60' : ''}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl">{plan.name}</CardTitle>
                  <Badge variant={plan.is_active ? 'default' : 'outline'}>
                    {plan.is_active ? 'Aktif' : 'Nonaktif'}
                  </Badge>
                </div>
                <div className="text-2xl font-bold text-primary mt-1">
                  {formatRupiah(plan.price_monthly)}
                  <span className="text-sm font-normal text-muted-foreground">/bln</span>
                </div>
                <div className="text-sm text-muted-foreground">
                  {formatRupiah(plan.price_yearly)}/tahun
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-sm space-y-1">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Max Outlet</span>
                    <span className="font-medium">{plan.max_outlets >= 9999 ? 'Unlimited' : plan.max_outlets}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Max Users</span>
                    <span className="font-medium">{plan.max_users >= 9999 ? 'Unlimited' : plan.max_users}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tenant Aktif</span>
                    <span className="font-medium">{plan.tenants_count ?? 0}</span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1">
                  {(plan.features ?? []).map((f) => (
                    <Badge key={f} variant="secondary" className="text-xs">{f}</Badge>
                  ))}
                </div>
                <div className="flex gap-2 pt-2 border-t">
                  <Button variant="outline" size="sm" className="flex-1" asChild>
                    <Link href={`/superadmin/plans/${plan.id}`}>
                      <Pencil className="h-3 w-3 mr-1" />
                      Edit
                    </Link>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    onClick={() => confirm('Hapus plan ini?') && deletePlan(plan.id)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
