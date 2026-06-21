'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { StorePlanPayload } from '@/lib/api/superadmin'
import { SubscriptionPlan } from '@/lib/types'
import { X, Plus } from 'lucide-react'
import { useState } from 'react'

const planSchema = z.object({
  name: z.string().min(2, 'Nama minimal 2 karakter'),
  price_monthly: z.string().transform((v) => parseFloat(v) || 0),
  price_yearly: z.string().transform((v) => parseFloat(v) || 0),
  max_outlets: z.string().transform((v) => parseInt(v) || 1),
  max_users: z.string().transform((v) => parseInt(v) || 1),
  is_active: z.boolean().default(true),
})

type PlanFormInput = {
  name: string
  price_monthly: string
  price_yearly: string
  max_outlets: string
  max_users: string
  is_active: boolean
}
type PlanFormValues = z.infer<typeof planSchema>

interface PlanFormProps {
  defaultValues?: Partial<SubscriptionPlan>
  onSubmit: (data: StorePlanPayload) => void
  isPending?: boolean
}

const PREDEFINED_FEATURES = [
  'pos', 'kds', 'qr_order', 'inventory', 'loyalty', 'voucher',
  'reservations', 'basic_reports', 'advanced_reports',
  'pdf_export', 'excel_export', 'api_access', 'central_kitchen',
  'marketplace_sync', 'whatsapp',
]

export function PlanForm({ defaultValues, onSubmit, isPending }: PlanFormProps) {
  const [features, setFeatures] = useState<string[]>(defaultValues?.features ?? [])
  const [customFeature, setCustomFeature] = useState('')

  const { register, handleSubmit, formState: { errors } } = useForm<PlanFormInput>({
    resolver: zodResolver(planSchema) as never,
    defaultValues: {
      name: defaultValues?.name ?? '',
      price_monthly: defaultValues?.price_monthly ?? '0',
      price_yearly: defaultValues?.price_yearly ?? '0',
      max_outlets: String(defaultValues?.max_outlets ?? 1),
      max_users: String(defaultValues?.max_users ?? 5),
      is_active: defaultValues?.is_active ?? true,
    },
  })

  const toggleFeature = (f: string) => {
    setFeatures((prev) => prev.includes(f) ? prev.filter((x) => x !== f) : [...prev, f])
  }

  const addCustomFeature = () => {
    const trimmed = customFeature.trim()
    if (trimmed && !features.includes(trimmed)) {
      setFeatures((prev) => [...prev, trimmed])
    }
    setCustomFeature('')
  }

  const handleFormSubmit = (values: PlanFormInput) => {
    onSubmit({
      name: values.name,
      price_monthly: parseFloat(values.price_monthly) || 0,
      price_yearly: parseFloat(values.price_yearly) || 0,
      max_outlets: parseInt(values.max_outlets) || 1,
      max_users: parseInt(values.max_users) || 1,
      is_active: values.is_active,
      features,
    })
  }

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      <Card>
        <CardContent className="pt-6 space-y-4">
          <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Info Plan</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 space-y-2">
              <Label>Nama Plan *</Label>
              <Input placeholder="Basic / Pro / Enterprise" {...register('name')} />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Harga Bulanan (IDR) *</Label>
              <Input type="number" placeholder="99000" {...register('price_monthly')} />
              {errors.price_monthly && <p className="text-xs text-destructive">{errors.price_monthly.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Harga Tahunan (IDR) *</Label>
              <Input type="number" placeholder="990000" {...register('price_yearly')} />
              {errors.price_yearly && <p className="text-xs text-destructive">{errors.price_yearly.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Max Outlet *</Label>
              <Input type="number" placeholder="1" {...register('max_outlets')} />
              {errors.max_outlets && <p className="text-xs text-destructive">{errors.max_outlets.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Max Users per Outlet *</Label>
              <Input type="number" placeholder="5" {...register('max_users')} />
              {errors.max_users && <p className="text-xs text-destructive">{errors.max_users.message}</p>}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6 space-y-4">
          <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Fitur</h3>
          <div className="flex flex-wrap gap-2">
            {PREDEFINED_FEATURES.map((f) => (
              <Badge
                key={f}
                variant={features.includes(f) ? 'default' : 'outline'}
                className="cursor-pointer select-none"
                onClick={() => toggleFeature(f)}
              >
                {f}
              </Badge>
            ))}
          </div>
          <div className="flex gap-2">
            <Input
              placeholder="Fitur custom..."
              value={customFeature}
              onChange={(e) => setCustomFeature(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomFeature())}
            />
            <Button type="button" variant="outline" size="icon" onClick={addCustomFeature}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          {features.filter((f) => !PREDEFINED_FEATURES.includes(f)).length > 0 && (
            <div className="flex flex-wrap gap-2">
              {features.filter((f) => !PREDEFINED_FEATURES.includes(f)).map((f) => (
                <Badge key={f} variant="secondary" className="gap-1">
                  {f}
                  <X className="h-3 w-3 cursor-pointer" onClick={() => toggleFeature(f)} />
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Menyimpan...' : 'Simpan Plan'}
        </Button>
      </div>
    </form>
  )
}
