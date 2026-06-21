'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import { useQuery, useMutation } from '@tanstack/react-query'
import { CheckCircle, Clock, ChefHat, Bell, Star } from 'lucide-react'
import { toast } from 'sonner'
import { publicApi } from '@/lib/api/public'
import { publicReviewApi } from '@/lib/api/customer'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

const STATUS_STEPS = [
  { key: 'pending',   label: 'Diterima',    icon: Clock },
  { key: 'confirmed', label: 'Dikonfirmasi', icon: CheckCircle },
  { key: 'preparing', label: 'Dimasak',      icon: ChefHat },
  { key: 'ready',     label: 'Siap',         icon: Bell },
  { key: 'served',    label: 'Disajikan',    icon: CheckCircle },
]

const STATUS_INDEX: Record<string, number> = {
  pending: 0, confirmed: 1, preparing: 2, ready: 3, served: 4, completed: 4,
}

function StarPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hover, setHover] = useState(0)
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map(i => (
        <button
          key={i}
          type="button"
          onMouseEnter={() => setHover(i)}
          onMouseLeave={() => setHover(0)}
          onClick={() => onChange(i)}
          className="focus:outline-none"
        >
          <Star className={`h-8 w-8 transition-colors ${i <= (hover || value) ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground'}`} />
        </button>
      ))}
    </div>
  )
}

export default function OrderStatusPage() {
  const params = useParams()
  const orderNumber = params.orderNumber as string

  const [reviewed, setReviewed] = useState(false)
  const [rating, setRating] = useState(0)
  const [foodRating, setFoodRating] = useState(0)
  const [comment, setComment] = useState('')
  const [reviewerName, setReviewerName] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['order-status', orderNumber],
    queryFn: () => publicApi.getOrderStatus(orderNumber),
    refetchInterval: (query) => {
      const status = query.state.data?.data?.data?.status
      return ['completed', 'cancelled'].includes(status) ? false : 10000
    },
  })

  const reviewMutation = useMutation({
    mutationFn: () => publicReviewApi.submitForOrder(orderNumber, {
      overall_rating: rating,
      food_rating: foodRating || undefined,
      comment: comment || undefined,
      reviewer_name: reviewerName || undefined,
    }),
    onSuccess: () => {
      toast.success('Terima kasih atas ulasanmu!')
      setReviewed(true)
    },
    onError: (e: { response?: { data?: { message?: string } } }) => {
      toast.error(e.response?.data?.message ?? 'Gagal mengirim ulasan')
    },
  })

  const order = data?.data?.data
  const currentStep = STATUS_INDEX[order?.status ?? 'pending'] ?? 0
  const isCompleted = order?.status === 'completed'

  if (isLoading) return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Memuat status order...</div>
  if (!order) return <div className="min-h-screen flex items-center justify-center text-destructive">Order tidak ditemukan.</div>

  return (
    <div className="min-h-screen bg-muted/30 flex flex-col">
      <div className="bg-primary text-primary-foreground p-4">
        <div className="max-w-lg mx-auto">
          <p className="text-sm opacity-80">Nomor Order</p>
          <p className="text-2xl font-bold tracking-wider">{order.order_number}</p>
        </div>
      </div>

      <div className="max-w-lg mx-auto w-full p-4 space-y-6 flex-1">
        {/* Status tracker */}
        <div className="bg-card rounded-xl p-5 shadow-sm">
          <h2 className="font-semibold mb-5">Status Pesanan</h2>
          <div className="relative">
            <div className="absolute left-4 top-4 bottom-4 w-0.5 bg-muted" />
            <div className="space-y-4">
              {STATUS_STEPS.map((step, i) => {
                const Icon = step.icon
                const done = i <= currentStep
                const active = i === currentStep
                return (
                  <div key={step.key} className="flex items-center gap-4">
                    <div className={cn(
                      'h-8 w-8 rounded-full flex items-center justify-center z-10 shrink-0',
                      active ? 'bg-primary text-primary-foreground' :
                      done ? 'bg-green-100 text-green-600' : 'bg-muted text-muted-foreground'
                    )}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <span className={cn('font-medium', active ? 'text-primary' : done ? 'text-foreground' : 'text-muted-foreground')}>
                      {step.label}
                    </span>
                    {active && <span className="ml-auto text-xs text-primary animate-pulse">● Sekarang</span>}
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Order items */}
        <div className="bg-card rounded-xl p-5 shadow-sm">
          <h2 className="font-semibold mb-3">Pesanan Kamu</h2>
          <div className="space-y-2">
            {order.items?.map((item: { id: number; menu_item_name: string; quantity: number; status: string }) => (
              <div key={item.id} className="flex justify-between text-sm">
                <span>{item.quantity}x {item.menu_item_name}</span>
                <span className={cn(
                  'text-xs px-2 py-0.5 rounded-full',
                  item.status === 'ready' || item.status === 'served' ? 'bg-green-100 text-green-700' :
                  item.status === 'preparing' ? 'bg-blue-100 text-blue-700' :
                  'bg-muted text-muted-foreground'
                )}>
                  {item.status}
                </span>
              </div>
            ))}
          </div>
          <div className="border-t mt-3 pt-3 flex justify-between font-semibold">
            <span>Total</span>
            <span>Rp {parseInt(order.total).toLocaleString('id-ID')}</span>
          </div>
        </div>

        {/* Review section — shown after order completed */}
        {isCompleted && !reviewed && (
          <div className="bg-card rounded-xl p-5 shadow-sm border-2 border-amber-200">
            <h2 className="font-semibold mb-1">Bagaimana pengalamanmu?</h2>
            <p className="text-sm text-muted-foreground mb-4">Berikan ulasan untuk membantu kami melayani lebih baik</p>

            <div className="mb-4">
              <p className="text-sm font-medium mb-2">Rating keseluruhan <span className="text-destructive">*</span></p>
              <StarPicker value={rating} onChange={setRating} />
            </div>

            <div className="mb-4">
              <p className="text-sm font-medium mb-2">Rating makanan (opsional)</p>
              <StarPicker value={foodRating} onChange={setFoodRating} />
            </div>

            <div className="mb-4">
              <p className="text-sm font-medium mb-1">Komentar (opsional)</p>
              <textarea
                className="w-full border rounded-lg px-3 py-2 text-sm bg-background h-20 resize-none"
                placeholder="Ceritakan pengalamanmu..."
                value={comment}
                onChange={e => setComment(e.target.value)}
              />
            </div>

            <div className="mb-4">
              <p className="text-sm font-medium mb-1">Nama (opsional)</p>
              <input
                className="w-full border rounded-lg px-3 py-2 text-sm bg-background"
                placeholder="Nama kamu..."
                value={reviewerName}
                onChange={e => setReviewerName(e.target.value)}
              />
            </div>

            <Button
              className="w-full"
              disabled={rating === 0 || reviewMutation.isPending}
              onClick={() => reviewMutation.mutate()}
            >
              {reviewMutation.isPending ? 'Mengirim...' : 'Kirim Ulasan'}
            </Button>
          </div>
        )}

        {isCompleted && reviewed && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-5 text-center">
            <CheckCircle className="h-10 w-10 text-green-500 mx-auto mb-2" />
            <p className="font-semibold text-green-800">Terima kasih atas ulasanmu!</p>
          </div>
        )}

        {!isCompleted && (
          <p className="text-xs text-center text-muted-foreground">Halaman ini otomatis update setiap 10 detik</p>
        )}
      </div>
    </div>
  )
}
