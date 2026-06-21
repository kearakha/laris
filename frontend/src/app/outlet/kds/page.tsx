'use client'

import { useEffect, useRef, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { orderApi, type Order } from '@/lib/api/outlet'
import { useAuthStore } from '@/lib/stores/authStore'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import Pusher from 'pusher-js'

const STATUS_COLS = [
  { key: 'pending', label: 'Baru Masuk', color: 'border-amber-400 bg-amber-50' },
  { key: 'confirmed', label: 'Dikonfirmasi', color: 'border-blue-400 bg-blue-50' },
  { key: 'preparing', label: 'Sedang Dimasak', color: 'border-purple-400 bg-purple-50' },
  { key: 'ready', label: 'Siap Disajikan', color: 'border-green-400 bg-green-50' },
]

function timeSince(dateStr: string) {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000)
  if (diff < 60) return `${diff}d`
  if (diff < 3600) return `${Math.floor(diff / 60)}m`
  return `${Math.floor(diff / 3600)}j`
}

export default function KdsPage() {
  const { user } = useAuthStore()
  const outletId = user?.outlet?.id
  const qc = useQueryClient()
  const pusherRef = useRef<Pusher | null>(null)

  const { data } = useQuery({
    queryKey: ['kds-orders', outletId],
    queryFn: () => orderApi.getOrders({
      status: 'pending,confirmed,preparing,ready',
      date: new Date().toISOString().slice(0, 10),
    }, outletId),
    refetchInterval: 30000,
  })

  const statusMutation = useMutation({
    mutationFn: ({ orderId, status }: { orderId: number; status: string }) =>
      orderApi.updateStatus(orderId, status, outletId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['kds-orders'] }),
    onError: () => toast.error('Gagal update status'),
  })

  useEffect(() => {
    if (!outletId) return

    pusherRef.current = new Pusher(process.env.NEXT_PUBLIC_REVERB_APP_KEY ?? 'laris-key', {
      wsHost: process.env.NEXT_PUBLIC_REVERB_HOST ?? 'localhost',
      wsPort: Number(process.env.NEXT_PUBLIC_REVERB_PORT ?? 8080),
      wssPort: Number(process.env.NEXT_PUBLIC_REVERB_PORT ?? 8080),
      forceTLS: false,
      enabledTransports: ['ws'],
      cluster: '',
    })

    const channel = pusherRef.current.subscribe(`outlet.${outletId}`)
    channel.bind('order.placed', () => {
      qc.invalidateQueries({ queryKey: ['kds-orders'] })
      toast.info('Order baru masuk!')
    })
    channel.bind('order.status_updated', () => {
      qc.invalidateQueries({ queryKey: ['kds-orders'] })
    })

    return () => {
      pusherRef.current?.unsubscribe(`outlet.${outletId}`)
      pusherRef.current?.disconnect()
    }
  }, [outletId, qc])

  const allOrders: Order[] = data?.data?.data?.data ?? []

  const nextStatus: Record<string, string> = {
    pending: 'preparing',
    confirmed: 'preparing',
    preparing: 'ready',
    ready: 'served',
  }

  const nextLabel: Record<string, string> = {
    pending: 'Mulai Masak',
    confirmed: 'Mulai Masak',
    preparing: 'Siap',
    ready: 'Sajikan',
  }

  return (
    <div className="p-4 h-screen flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold">Kitchen Display System</h1>
        <span className="text-xs text-muted-foreground">
          {new Date().toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}
        </span>
      </div>

      <div className="grid grid-cols-4 gap-4 flex-1 overflow-hidden">
        {STATUS_COLS.map(col => {
          const colOrders = allOrders.filter(o => o.status === col.key)
          return (
            <div key={col.key} className="flex flex-col">
              <div className={cn('rounded-t-lg px-3 py-2 border-t-2 font-semibold text-sm', col.color)}>
                {col.label}
                <span className="ml-2 bg-white/60 text-xs px-1.5 py-0.5 rounded-full">{colOrders.length}</span>
              </div>
              <div className="flex-1 overflow-y-auto space-y-3 pt-2 pb-4">
                {colOrders.map(order => (
                  <div key={order.id} className={cn('border-l-4 bg-card rounded-lg p-3 shadow-sm', col.color.split(' ')[0])}>
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-bold text-sm">{order.order_number}</span>
                      <span className="text-xs text-muted-foreground">{timeSince(order.created_at)}</span>
                    </div>
                    {order.table && (
                      <p className="text-xs text-muted-foreground mb-1">{order.table.name}</p>
                    )}
                    {order.customer_name && (
                      <p className="text-xs font-medium mb-1">{order.customer_name}</p>
                    )}
                    <div className="space-y-0.5 mb-3">
                      {order.items?.map(item => (
                        <div key={item.id} className="text-xs flex gap-1">
                          <span className="font-semibold">{item.quantity}x</span>
                          <span>{item.menu_item_name}</span>
                          {item.notes && <span className="text-muted-foreground italic">({item.notes})</span>}
                        </div>
                      ))}
                    </div>
                    {order.notes && (
                      <p className="text-xs italic text-muted-foreground mb-2">📝 {order.notes}</p>
                    )}
                    {nextStatus[order.status] && (
                      <button
                        onClick={() => statusMutation.mutate({ orderId: order.id, status: nextStatus[order.status] })}
                        disabled={statusMutation.isPending}
                        className="w-full py-1.5 text-xs font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
                      >
                        {nextLabel[order.status]}
                      </button>
                    )}
                  </div>
                ))}
                {colOrders.length === 0 && (
                  <p className="text-xs text-center text-muted-foreground pt-4">Kosong</p>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
