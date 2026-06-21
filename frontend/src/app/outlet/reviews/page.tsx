'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Star, MessageSquare, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import { useAuthStore } from '@/lib/stores/authStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import apiClient from '@/lib/api/client'

interface Review {
  id: number
  overall_rating: number
  food_rating: number | null
  service_rating: number | null
  ambiance_rating: number | null
  comment: string | null
  reviewer_name: string | null
  is_published: boolean
  reply: string | null
  replied_at: string | null
  created_at: string
  customer?: { id: number; name: string } | null
}

interface Complaint {
  id: number
  category: string
  description: string
  status: string
  contact_name: string | null
  contact_phone: string | null
  resolution_notes: string | null
  created_at: string
  customer?: { id: number; name: string } | null
}

function StarRating({ rating }: { rating: number }) {
  return (
    <span className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <Star key={i} className={`h-3.5 w-3.5 ${i <= rating ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground'}`} />
      ))}
    </span>
  )
}

export default function ReviewsPage() {
  const { user } = useAuthStore()
  const outletId = user?.outlet?.id
  const qc = useQueryClient()
  const headers = outletId ? { 'X-Outlet-Id': String(outletId) } : {}

  const [replyReview, setReplyReview] = useState<Review | null>(null)
  const [replyText, setReplyText] = useState('')
  const [resolvingComplaint, setResolvingComplaint] = useState<Complaint | null>(null)
  const [resolutionText, setResolutionText] = useState('')

  const { data: reviewData } = useQuery({
    queryKey: ['outlet-reviews', outletId],
    queryFn: () => apiClient.get('/api/v1/outlet/reviews', { headers }),
  })

  const { data: complaintData } = useQuery({
    queryKey: ['outlet-complaints', outletId],
    queryFn: () => apiClient.get('/api/v1/outlet/complaints', { headers }),
  })

  const replyMutation = useMutation({
    mutationFn: ({ id, reply }: { id: number; reply: string }) =>
      apiClient.post(`/api/v1/outlet/reviews/${id}/reply`, { reply }, { headers }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['outlet-reviews'] })
      toast.success('Balasan dikirim')
      setReplyReview(null)
      setReplyText('')
    },
    onError: () => toast.error('Gagal mengirim balasan'),
  })

  const resolveMutation = useMutation({
    mutationFn: ({ id, resolution_notes }: { id: number; resolution_notes: string }) =>
      apiClient.patch(`/api/v1/outlet/complaints/${id}/resolve`, { resolution_notes }, { headers }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['outlet-complaints'] })
      toast.success('Complaint diselesaikan')
      setResolvingComplaint(null)
      setResolutionText('')
    },
    onError: () => toast.error('Gagal menyelesaikan complaint'),
  })

  const reviewMeta = reviewData?.data?.data
  const reviews: Review[] = reviewMeta?.reviews?.data ?? []
  const avgRating: number = reviewMeta?.avg_rating ?? 0
  const totalReviews: number = reviewMeta?.total ?? 0

  const complaints: Complaint[] = complaintData?.data?.data?.data ?? []
  const openComplaints = complaints.filter(c => c.status !== 'resolved').length

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Ulasan & Feedback</h1>
        <p className="text-muted-foreground text-sm">Pantau dan balas ulasan pelanggan</p>
      </div>

      <Tabs defaultValue="reviews">
        <TabsList className="mb-4">
          <TabsTrigger value="reviews">
            Ulasan
            {totalReviews > 0 && <span className="ml-1.5 text-xs text-muted-foreground">({totalReviews})</span>}
          </TabsTrigger>
          <TabsTrigger value="complaints">
            Komplain
            {openComplaints > 0 && (
              <span className="ml-1.5 bg-destructive text-destructive-foreground text-xs rounded-full px-1.5 py-0.5">{openComplaints}</span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="reviews">
          {totalReviews > 0 && (
            <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg mb-4">
              <span className="text-3xl font-bold text-amber-600">{avgRating}</span>
              <div>
                <StarRating rating={Math.round(avgRating)} />
                <p className="text-xs text-muted-foreground mt-0.5">{totalReviews} ulasan</p>
              </div>
            </div>
          )}

          {reviews.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>Belum ada ulasan</p>
            </div>
          ) : (
            <div className="space-y-3">
              {reviews.map(r => (
                <div key={r.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-medium text-sm">{r.reviewer_name ?? r.customer?.name ?? 'Anonim'}</p>
                      <StarRating rating={r.overall_rating} />
                    </div>
                    <span className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString('id-ID')}</span>
                  </div>
                  {r.comment && <p className="text-sm text-muted-foreground mb-3">{r.comment}</p>}
                  {r.reply ? (
                    <div className="bg-muted/50 rounded-lg p-3 text-sm border-l-2 border-primary">
                      <p className="text-xs font-medium text-primary mb-1">Balasan Anda</p>
                      <p className="text-muted-foreground">{r.reply}</p>
                    </div>
                  ) : (
                    <Button size="sm" variant="outline" onClick={() => setReplyReview(r)}>
                      <MessageSquare className="h-3.5 w-3.5 mr-1" /> Balas
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="complaints">
          {complaints.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <AlertCircle className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>Tidak ada komplain</p>
            </div>
          ) : (
            <div className="space-y-3">
              {complaints.map(c => (
                <div key={c.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs capitalize">{c.category}</Badge>
                      <Badge variant={c.status === 'resolved' ? 'secondary' : 'destructive'} className="text-xs">
                        {c.status === 'resolved' ? 'Selesai' : c.status === 'in_progress' ? 'Diproses' : 'Terbuka'}
                      </Badge>
                    </div>
                    <span className="text-xs text-muted-foreground">{new Date(c.created_at).toLocaleDateString('id-ID')}</span>
                  </div>
                  <p className="text-sm mb-1">{c.description}</p>
                  {c.contact_name && <p className="text-xs text-muted-foreground">{c.contact_name} · {c.contact_phone}</p>}
                  {c.resolution_notes && (
                    <div className="mt-2 bg-green-50 rounded p-2 text-xs text-green-700">
                      Resolusi: {c.resolution_notes}
                    </div>
                  )}
                  {c.status !== 'resolved' && (
                    <Button size="sm" variant="outline" className="mt-2" onClick={() => setResolvingComplaint(c)}>
                      Selesaikan
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Reply Dialog */}
      <Dialog open={!!replyReview} onOpenChange={() => setReplyReview(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Balas Ulasan</DialogTitle></DialogHeader>
          {replyReview && (
            <div className="mb-3 p-3 bg-muted/50 rounded text-sm">
              <StarRating rating={replyReview.overall_rating} />
              <p className="mt-1 text-muted-foreground">{replyReview.comment ?? '(tanpa komentar)'}</p>
            </div>
          )}
          <div>
            <Label>Balasan Anda</Label>
            <textarea
              className="w-full border rounded-lg px-3 py-2 text-sm bg-background mt-1 h-24 resize-none"
              value={replyText}
              onChange={e => setReplyText(e.target.value)}
              placeholder="Tulis balasan..."
            />
          </div>
          <Button
            className="w-full"
            disabled={replyMutation.isPending || !replyText}
            onClick={() => replyReview && replyMutation.mutate({ id: replyReview.id, reply: replyText })}
          >
            Kirim Balasan
          </Button>
        </DialogContent>
      </Dialog>

      {/* Resolve Complaint Dialog */}
      <Dialog open={!!resolvingComplaint} onOpenChange={() => setResolvingComplaint(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Selesaikan Komplain</DialogTitle></DialogHeader>
          <div>
            <Label>Catatan Resolusi</Label>
            <textarea
              className="w-full border rounded-lg px-3 py-2 text-sm bg-background mt-1 h-24 resize-none"
              value={resolutionText}
              onChange={e => setResolutionText(e.target.value)}
              placeholder="Apa yang sudah dilakukan..."
            />
          </div>
          <Button
            className="w-full"
            disabled={resolveMutation.isPending || !resolutionText}
            onClick={() => resolvingComplaint && resolveMutation.mutate({ id: resolvingComplaint.id, resolution_notes: resolutionText })}
          >
            Simpan Resolusi
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  )
}
