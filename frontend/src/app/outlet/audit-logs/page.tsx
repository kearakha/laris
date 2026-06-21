'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Shield, ChevronDown, ChevronUp } from 'lucide-react'
import { useAuthStore } from '@/lib/stores/authStore'
import apiClient from '@/lib/api/client'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const ACTION_COLORS: Record<string, string> = {
  void_order:   'bg-red-100 text-red-700',
  refund_order: 'bg-orange-100 text-orange-700',
  create:       'bg-green-100 text-green-700',
  update:       'bg-blue-100 text-blue-700',
  delete:       'bg-red-50 text-red-500',
}

interface AuditLog {
  id: number
  action: string
  model_type: string
  model_id: number
  old_values: Record<string, unknown> | null
  new_values: Record<string, unknown> | null
  ip_address: string | null
  created_at: string
  user: { id: number; name: string } | null
}

export default function AuditLogsPage() {
  const { user } = useAuthStore()
  const outletId = user?.outlet?.id
  const headers = outletId ? { 'X-Outlet-Id': String(outletId) } : {}

  const [dateFilter, setDateFilter] = useState('')
  const [actionFilter, setActionFilter] = useState('')
  const [expandedId, setExpandedId] = useState<number | null>(null)

  const { data } = useQuery({
    queryKey: ['audit-logs', outletId, dateFilter, actionFilter],
    queryFn: () => apiClient.get('/api/v1/outlet/audit-logs', {
      params: {
        ...(dateFilter ? { date: dateFilter } : {}),
        ...(actionFilter && actionFilter !== 'all' ? { action: actionFilter } : {}),
      },
      headers,
    }),
  })

  const logs: AuditLog[] = data?.data?.data?.data ?? []

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Audit Log</h1>
        <p className="text-muted-foreground text-sm">Riwayat perubahan data penting</p>
      </div>

      <div className="flex gap-3 mb-4">
        <Input
          type="date"
          value={dateFilter}
          onChange={e => setDateFilter(e.target.value)}
          className="max-w-xs"
        />
        <Select value={actionFilter} onValueChange={setActionFilter}>
          <SelectTrigger className="max-w-[180px]">
            <SelectValue placeholder="Semua aksi" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua aksi</SelectItem>
            <SelectItem value="void_order">Void order</SelectItem>
            <SelectItem value="refund_order">Refund order</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {logs.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Shield className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>Tidak ada log</p>
        </div>
      ) : (
        <div className="space-y-2">
          {logs.map(log => (
            <div key={log.id} className="border rounded-lg overflow-hidden">
              <div
                className="flex items-center gap-3 p-3 cursor-pointer hover:bg-muted/20"
                onClick={() => setExpandedId(expandedId === log.id ? null : log.id)}
              >
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${ACTION_COLORS[log.action] ?? 'bg-muted text-muted-foreground'}`}>
                  {log.action}
                </span>
                <span className="text-sm font-medium">{log.user?.name ?? 'System'}</span>
                <span className="text-xs text-muted-foreground">
                  {log.model_type.split('\\').pop()} #{log.model_id}
                </span>
                <span className="ml-auto text-xs text-muted-foreground shrink-0">
                  {new Date(log.created_at).toLocaleString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                </span>
                {expandedId === log.id ? <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" /> : <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />}
              </div>
              {expandedId === log.id && (
                <div className="border-t p-3 bg-muted/30 grid md:grid-cols-2 gap-3 text-xs font-mono">
                  <div>
                    <p className="font-sans font-medium text-muted-foreground mb-1">Before</p>
                    <pre className="whitespace-pre-wrap text-muted-foreground">{JSON.stringify(log.old_values, null, 2) ?? '-'}</pre>
                  </div>
                  <div>
                    <p className="font-sans font-medium text-muted-foreground mb-1">After</p>
                    <pre className="whitespace-pre-wrap">{JSON.stringify(log.new_values, null, 2) ?? '-'}</pre>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
