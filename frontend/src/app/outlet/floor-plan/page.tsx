'use client'

import { useState, useRef, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Save, Plus, Minus, RotateCcw } from 'lucide-react'
import { toast } from 'sonner'
import { useAuthStore } from '@/lib/stores/authStore'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import apiClient from '@/lib/api/client'
import { cn } from '@/lib/utils'

interface FloorTable {
  id: number
  name: string
  capacity: number
  status: string
  floor: string
  pos_x: number
  pos_y: number
  shape: 'square' | 'round'
  qr_code: string
}

const CELL_SIZE = 72
const GRID_COLS = 12
const GRID_ROWS = 10

const STATUS_COLORS: Record<string, string> = {
  available: 'bg-green-100 border-green-300 text-green-800',
  occupied:  'bg-red-100 border-red-300 text-red-800',
  reserved:  'bg-amber-100 border-amber-300 text-amber-800',
}

export default function FloorPlanPage() {
  const { user } = useAuthStore()
  const outletId = user?.outlet?.id
  const qc = useQueryClient()
  const headers = outletId ? { 'X-Outlet-Id': String(outletId) } : {}

  const [selectedFloor, setSelectedFloor] = useState<string>('1')
  const [positions, setPositions] = useState<Record<number, { pos_x: number; pos_y: number }>>({})
  const [dragging, setDragging] = useState<{ id: number; offsetX: number; offsetY: number } | null>(null)
  const gridRef = useRef<HTMLDivElement>(null)

  const { data } = useQuery({
    queryKey: ['floor-plan', outletId, selectedFloor],
    queryFn: () => apiClient.get('/api/v1/outlet/floor-plan', { params: { floor: selectedFloor }, headers }),
  })

  const saveMutation = useMutation({
    mutationFn: () => {
      const tables = (data?.data?.data?.tables ?? []).map((t: FloorTable) => ({
        id: t.id,
        pos_x: positions[t.id]?.pos_x ?? t.pos_x,
        pos_y: positions[t.id]?.pos_y ?? t.pos_y,
        floor: selectedFloor,
        shape: t.shape,
      }))
      return apiClient.put('/api/v1/outlet/floor-plan/positions', { tables }, { headers })
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['floor-plan'] })
      toast.success('Layout disimpan')
      setPositions({})
    },
    onError: () => toast.error('Gagal menyimpan layout'),
  })

  const floors: string[] = data?.data?.data?.floors ?? ['1']
  const tables: FloorTable[] = data?.data?.data?.tables ?? []

  const getPos = (t: FloorTable) => ({
    x: positions[t.id]?.pos_x ?? t.pos_x,
    y: positions[t.id]?.pos_y ?? t.pos_y,
  })

  const handleMouseDown = useCallback((e: React.MouseEvent, tableId: number) => {
    e.preventDefault()
    const rect = (e.target as HTMLElement).closest('[data-table]')?.getBoundingClientRect()
    if (!rect) return
    setDragging({
      id: tableId,
      offsetX: e.clientX - rect.left,
      offsetY: e.clientY - rect.top,
    })
  }, [])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!dragging || !gridRef.current) return
    const gridRect = gridRef.current.getBoundingClientRect()
    const relX = e.clientX - gridRect.left - dragging.offsetX
    const relY = e.clientY - gridRect.top - dragging.offsetY
    const col = Math.max(0, Math.min(GRID_COLS - 1, Math.round(relX / CELL_SIZE)))
    const row = Math.max(0, Math.min(GRID_ROWS - 1, Math.round(relY / CELL_SIZE)))
    setPositions(p => ({ ...p, [dragging.id]: { pos_x: col, pos_y: row } }))
  }, [dragging])

  const handleMouseUp = useCallback(() => {
    setDragging(null)
  }, [])

  const hasChanges = Object.keys(positions).length > 0

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Floor Plan</h1>
          <p className="text-muted-foreground text-sm">Atur posisi meja secara visual — drag untuk pindah</p>
        </div>
        <div className="flex gap-2">
          {hasChanges && (
            <Button variant="ghost" onClick={() => setPositions({})}>
              <RotateCcw className="h-4 w-4 mr-1" /> Reset
            </Button>
          )}
          <Button disabled={!hasChanges || saveMutation.isPending} onClick={() => saveMutation.mutate()}>
            <Save className="h-4 w-4 mr-1" /> Simpan Layout
          </Button>
        </div>
      </div>

      {/* Floor tabs */}
      {floors.length > 1 && (
        <div className="flex gap-2 mb-4">
          {floors.map(f => (
            <button
              key={f}
              onClick={() => setSelectedFloor(f)}
              className={cn(
                'px-4 py-1.5 rounded-full text-sm font-medium border transition-colors',
                selectedFloor === f ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-muted-foreground hover:bg-muted'
              )}
            >
              Lantai {f}
            </button>
          ))}
        </div>
      )}

      {/* Legend */}
      <div className="flex gap-3 mb-3 text-xs">
        {Object.entries(STATUS_COLORS).map(([s, c]) => (
          <span key={s} className={`px-2 py-0.5 rounded border ${c}`}>{s}</span>
        ))}
        <span className="text-muted-foreground ml-2">Drag meja untuk ubah posisi</span>
      </div>

      {/* Grid */}
      <div className="overflow-auto border rounded-xl bg-muted/20">
        <div
          ref={gridRef}
          className="relative select-none"
          style={{ width: GRID_COLS * CELL_SIZE, height: GRID_ROWS * CELL_SIZE, minWidth: GRID_COLS * CELL_SIZE }}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          {/* Grid lines */}
          {Array.from({ length: GRID_ROWS }).map((_, r) =>
            Array.from({ length: GRID_COLS }).map((_, c) => (
              <div
                key={`${r}-${c}`}
                className="absolute border border-border/20"
                style={{ left: c * CELL_SIZE, top: r * CELL_SIZE, width: CELL_SIZE, height: CELL_SIZE }}
              />
            ))
          )}

          {/* Tables */}
          {tables.map(t => {
            const { x, y } = getPos(t)
            const isDragged = dragging?.id === t.id
            return (
              <div
                key={t.id}
                data-table={t.id}
                onMouseDown={e => handleMouseDown(e, t.id)}
                className={cn(
                  'absolute cursor-grab active:cursor-grabbing transition-shadow flex flex-col items-center justify-center text-xs font-medium border-2',
                  t.shape === 'round' ? 'rounded-full' : 'rounded-lg',
                  STATUS_COLORS[t.status] ?? STATUS_COLORS.available,
                  isDragged ? 'shadow-xl z-10 scale-105' : 'hover:shadow-md z-0',
                  'select-none'
                )}
                style={{
                  left: x * CELL_SIZE + 4,
                  top: y * CELL_SIZE + 4,
                  width: CELL_SIZE - 8,
                  height: CELL_SIZE - 8,
                  transition: isDragged ? 'none' : 'left 0.1s, top 0.1s',
                }}
              >
                <span className="font-bold leading-none">{t.name}</span>
                <span className="opacity-60 mt-0.5">{t.capacity} pax</span>
              </div>
            )
          })}
        </div>
      </div>

      {tables.length === 0 && (
        <p className="text-center text-sm text-muted-foreground mt-4">
          Belum ada meja. Buat meja di halaman{' '}
          <a href="/outlet/tables" className="text-primary underline">Meja</a>.
        </p>
      )}
    </div>
  )
}
