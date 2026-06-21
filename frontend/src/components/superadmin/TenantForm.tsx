'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { usePlans } from '@/lib/hooks/usePlans'
import { Tenant } from '@/lib/types'
import { StoreTenantPayload } from '@/lib/api/superadmin'
import { Card, CardContent } from '@/components/ui/card'

const tenantSchema = z.object({
  name: z.string().min(2, 'Nama minimal 2 karakter'),
  slug: z.string().min(2).regex(/^[a-z0-9-]+$/, 'Hanya huruf kecil, angka, dan tanda hubung'),
  email: z.string().email('Format email tidak valid'),
  phone: z.string().optional(),
  primary_color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Format warna tidak valid').optional(),
  subscription_plan_id: z.string().optional(),
  subscription_status: z.enum(['active', 'trial', 'cancelled', 'expired']).optional(),
  trial_ends_at: z.string().optional(),
  owner_name: z.string().min(2, 'Nama owner minimal 2 karakter').optional(),
  owner_email: z.string().email('Format email tidak valid').optional(),
  owner_password: z.string().min(8, 'Password minimal 8 karakter').optional(),
  owner_phone: z.string().optional(),
})

type TenantFormValues = z.infer<typeof tenantSchema>

interface TenantFormProps {
  defaultValues?: Partial<Tenant>
  onSubmit: (data: StoreTenantPayload) => void
  isPending?: boolean
  isEdit?: boolean
}

export function TenantForm({ defaultValues, onSubmit, isPending, isEdit }: TenantFormProps) {
  const { data: plansData } = usePlans()
  const plans = plansData?.data ?? []

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<TenantFormValues>({
    resolver: zodResolver(tenantSchema),
    defaultValues: {
      name: defaultValues?.name ?? '',
      slug: defaultValues?.slug ?? '',
      email: defaultValues?.email ?? '',
      phone: defaultValues?.phone ?? '',
      primary_color: defaultValues?.primary_color ?? '#3B82F6',
      subscription_plan_id: defaultValues?.subscription_plan_id?.toString() ?? '',
      subscription_status: (defaultValues?.subscription_status as TenantFormValues['subscription_status']) ?? 'trial',
    },
  })

  const handleFormSubmit = (values: TenantFormValues) => {
    onSubmit({
      ...values,
      subscription_plan_id: values.subscription_plan_id ? parseInt(values.subscription_plan_id) : undefined,
    } as StoreTenantPayload)
  }

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      <Card>
        <CardContent className="pt-6 space-y-4">
          <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Info Tenant</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Nama Brand *</Label>
              <Input placeholder="Mie Gacoan" {...register('name')} />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Slug (subdomain) *</Label>
              <Input placeholder="mie-gacoan" {...register('slug')} />
              {errors.slug && <p className="text-xs text-destructive">{errors.slug.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Email *</Label>
              <Input type="email" placeholder="owner@brand.com" {...register('email')} />
              {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>No. Telepon</Label>
              <Input placeholder="08xxxxxxxxxx" {...register('phone')} />
            </div>
            <div className="space-y-2">
              <Label>Warna Utama</Label>
              <Input type="color" {...register('primary_color')} className="h-10 px-2 cursor-pointer" />
            </div>
            <div className="space-y-2">
              <Label>Subscription Plan</Label>
              <Select onValueChange={(v) => setValue('subscription_plan_id', v)}
                defaultValue={defaultValues?.subscription_plan_id?.toString()}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih plan" />
                </SelectTrigger>
                <SelectContent>
                  {plans.map((p) => (
                    <SelectItem key={p.id} value={p.id.toString()}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select onValueChange={(v) => setValue('subscription_status', v as TenantFormValues['subscription_status'])}
                defaultValue={defaultValues?.subscription_status ?? 'trial'}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="trial">Trial</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Trial Berakhir</Label>
              <Input type="date" {...register('trial_ends_at')} />
            </div>
          </div>
        </CardContent>
      </Card>

      {!isEdit && (
        <Card>
          <CardContent className="pt-6 space-y-4">
            <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Akun Tenant Owner</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nama Owner *</Label>
                <Input placeholder="Budi Santoso" {...register('owner_name')} />
                {errors.owner_name && <p className="text-xs text-destructive">{errors.owner_name.message}</p>}
              </div>
              <div className="space-y-2">
                <Label>Email Owner *</Label>
                <Input type="email" placeholder="budi@brand.com" {...register('owner_email')} />
                {errors.owner_email && <p className="text-xs text-destructive">{errors.owner_email.message}</p>}
              </div>
              <div className="space-y-2">
                <Label>Password *</Label>
                <Input type="password" placeholder="Min. 8 karakter" {...register('owner_password')} />
                {errors.owner_password && <p className="text-xs text-destructive">{errors.owner_password.message}</p>}
              </div>
              <div className="space-y-2">
                <Label>Telepon Owner</Label>
                <Input placeholder="08xxxxxxxxxx" {...register('owner_phone')} />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex justify-end">
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Menyimpan...' : isEdit ? 'Simpan Perubahan' : 'Buat Tenant'}
        </Button>
      </div>
    </form>
  )
}
