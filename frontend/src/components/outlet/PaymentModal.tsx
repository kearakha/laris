'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { orderApi } from '@/lib/api/outlet'
import type { Order } from '@/lib/api/outlet'
import { formatRupiah } from '@/lib/utils'
import { Banknote, CreditCard, QrCode, Tag } from 'lucide-react'

interface PaymentModalProps {
  order: Order
  open: boolean
  onClose: () => void
  onSuccess: () => void
}

const PAYMENT_METHODS = [
  { value: 'cash', label: 'Tunai', icon: Banknote },
  { value: 'qris', label: 'QRIS', icon: QrCode },
  { value: 'transfer', label: 'Transfer', icon: CreditCard },
  { value: 'card', label: 'Kartu', icon: CreditCard },
] as const

export function PaymentModal({ order, open, onClose, onSuccess }: PaymentModalProps) {
  const [method, setMethod] = useState<'cash' | 'qris' | 'transfer' | 'card'>('cash')
  const [amountPaid, setAmountPaid] = useState('')
  const [voucherCode, setVoucherCode] = useState('')
  const [voucherDiscount, setVoucherDiscount] = useState<number | null>(null)
  const [voucherApplied, setVoucherApplied] = useState(false)
  const [loadingVoucher, setLoadingVoucher] = useState(false)
  const [loadingPay, setLoadingPay] = useState(false)

  const total = parseFloat(order.total)
  const finalTotal = voucherDiscount !== null ? Math.max(0, total - voucherDiscount) : total
  const paid = parseFloat(amountPaid) || 0
  const change = Math.max(0, paid - finalTotal)

  const handleValidateVoucher = async () => {
    if (!voucherCode.trim()) return
    setLoadingVoucher(true)
    try {
      const res = await orderApi.validateVoucher(voucherCode.trim(), total)
      const data = res.data.data
      setVoucherDiscount(data.discount_amount)
      toast.success(`Voucher "${data.name}" — diskon ${formatRupiah(data.discount_amount)}`)
    } catch {
      toast.error('Voucher tidak valid')
      setVoucherDiscount(null)
    } finally {
      setLoadingVoucher(false)
    }
  }

  const handleApplyVoucher = async () => {
    if (!voucherCode.trim() || voucherDiscount === null) return
    setLoadingVoucher(true)
    try {
      await orderApi.applyVoucher(order.id, voucherCode.trim())
      setVoucherApplied(true)
      toast.success('Voucher berhasil diaplikasikan')
    } catch {
      toast.error('Gagal mengaplikasikan voucher')
    } finally {
      setLoadingVoucher(false)
    }
  }

  const handlePay = async () => {
    if (method === 'cash' && paid < finalTotal) {
      toast.error('Jumlah pembayaran kurang')
      return
    }
    setLoadingPay(true)
    try {
      const payload: { method: string; amount_paid?: number } = { method }
      if (method === 'cash') payload.amount_paid = paid

      const res = await orderApi.processPayment(order.id, payload)
      const data = res.data.data

      if (method === 'cash') {
        toast.success(`Pembayaran berhasil. Kembalian: ${formatRupiah(data.change_amount)}`)
        onSuccess()
      } else {
        // Non-cash: open Midtrans snap
        if (data.redirect_url) {
          window.open(data.redirect_url, '_blank')
        }
        toast.success('Link pembayaran dibuka di tab baru')
        onSuccess()
      }
    } catch {
      toast.error('Gagal memproses pembayaran')
    } finally {
      setLoadingPay(false)
    }
  }

  const QUICK_AMOUNTS = [
    Math.ceil(finalTotal / 1000) * 1000,
    Math.ceil(finalTotal / 5000) * 5000,
    Math.ceil(finalTotal / 10000) * 10000,
    Math.ceil(finalTotal / 50000) * 50000,
  ].filter((v, i, arr) => arr.indexOf(v) === i && v >= finalTotal).slice(0, 4)

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Proses Pembayaran — {order.order_number}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Order total */}
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground">Subtotal</span>
            <span>{formatRupiah(order.subtotal)}</span>
          </div>
          {order.tax_amount && parseFloat(order.tax_amount) > 0 && (
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Pajak</span>
              <span>{formatRupiah(order.tax_amount)}</span>
            </div>
          )}
          {voucherDiscount !== null && (
            <div className="flex justify-between items-center text-sm text-green-600">
              <span>Diskon voucher</span>
              <span>- {formatRupiah(voucherDiscount)}</span>
            </div>
          )}
          <div className="flex justify-between items-center font-bold text-lg border-t pt-2">
            <span>Total</span>
            <span>{formatRupiah(finalTotal)}</span>
          </div>

          <Separator />

          {/* Voucher */}
          {!voucherApplied && (
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5">
                <Tag className="h-3 w-3" /> Voucher
              </Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Kode voucher"
                  value={voucherCode}
                  onChange={e => { setVoucherCode(e.target.value.toUpperCase()); setVoucherDiscount(null) }}
                  className="text-sm"
                />
                {voucherDiscount === null ? (
                  <Button variant="outline" size="sm" onClick={handleValidateVoucher} disabled={loadingVoucher || !voucherCode}>
                    Cek
                  </Button>
                ) : (
                  <Button variant="default" size="sm" onClick={handleApplyVoucher} disabled={loadingVoucher}>
                    Pakai
                  </Button>
                )}
              </div>
            </div>
          )}
          {voucherApplied && (
            <Badge variant="secondary" className="w-fit">
              ✓ Voucher {voucherCode} diterapkan
            </Badge>
          )}

          <Separator />

          {/* Payment method */}
          <div className="space-y-2">
            <Label>Metode Pembayaran</Label>
            <div className="grid grid-cols-4 gap-2">
              {PAYMENT_METHODS.map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  onClick={() => setMethod(value)}
                  className={`flex flex-col items-center gap-1 p-2 rounded-lg border text-xs transition-colors ${
                    method === value
                      ? 'border-primary bg-primary/5 text-primary'
                      : 'border-border text-muted-foreground hover:border-primary/50'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Cash input */}
          {method === 'cash' && (
            <div className="space-y-2">
              <Label>Jumlah Diterima</Label>
              <Input
                type="number"
                placeholder={String(finalTotal)}
                value={amountPaid}
                onChange={e => setAmountPaid(e.target.value)}
              />
              <div className="flex gap-2 flex-wrap">
                {QUICK_AMOUNTS.map(amt => (
                  <Button key={amt} variant="outline" size="sm" className="text-xs" onClick={() => setAmountPaid(String(amt))}>
                    {formatRupiah(amt)}
                  </Button>
                ))}
              </div>
              {paid >= finalTotal && (
                <div className="flex justify-between text-sm font-medium text-green-600">
                  <span>Kembalian</span>
                  <span>{formatRupiah(change)}</span>
                </div>
              )}
            </div>
          )}

          <Button
            className="w-full"
            onClick={handlePay}
            disabled={loadingPay || (method === 'cash' && paid < finalTotal)}
          >
            {loadingPay ? 'Memproses...' : `Bayar ${formatRupiah(finalTotal)}`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
