'use client'

import { useEffect, useState, useCallback } from 'react'
import { syncPendingOrders, getPendingCount } from './sync'
import { toast } from 'sonner'

export function useOfflineSync(outletId: number | undefined) {
  const [isOnline, setIsOnline] = useState(true)
  const [pendingCount, setPendingCount] = useState(0)
  const [syncing, setSyncing] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    setIsOnline(navigator.onLine)

    const onOnline = () => setIsOnline(true)
    const onOffline = () => setIsOnline(false)

    window.addEventListener('online', onOnline)
    window.addEventListener('offline', onOffline)
    return () => {
      window.removeEventListener('online', onOnline)
      window.removeEventListener('offline', onOffline)
    }
  }, [])

  const refreshPendingCount = useCallback(async () => {
    if (!outletId) return
    const count = await getPendingCount(outletId)
    setPendingCount(count)
  }, [outletId])

  // Refresh pending count on mount and when coming back online
  useEffect(() => {
    refreshPendingCount()
  }, [refreshPendingCount])

  // Auto-sync when coming back online
  useEffect(() => {
    if (!isOnline || !outletId || pendingCount === 0) return

    const sync = async () => {
      setSyncing(true)
      const result = await syncPendingOrders(outletId)
      setSyncing(false)
      if (result.synced > 0) {
        toast.success(`${result.synced} order offline berhasil disinkronisasi`)
        refreshPendingCount()
      }
      if (result.failed > 0) {
        toast.error(`${result.failed} order gagal sync — coba lagi`)
      }
    }

    // Small delay to let connection stabilize
    const t = setTimeout(sync, 2000)
    return () => clearTimeout(t)
  }, [isOnline, outletId, pendingCount, refreshPendingCount])

  const manualSync = async () => {
    if (!outletId) return
    setSyncing(true)
    const result = await syncPendingOrders(outletId)
    setSyncing(false)
    refreshPendingCount()
    return result
  }

  return { isOnline, pendingCount, syncing, manualSync, refreshPendingCount }
}
