'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Plus, Search, RefreshCw, Trash2, Pencil } from 'lucide-react'
import { Header } from '@/components/shared/Header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useDeleteTenant, useRestoreTenant, useTenants } from '@/lib/hooks/useTenants'
import { Tenant } from '@/lib/types'

const statusVariant: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  active: 'default',
  trial: 'secondary',
  cancelled: 'outline',
  expired: 'destructive',
}

export default function TenantsPage() {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)

  const { data, isLoading } = useTenants({ search, page })
  const { mutate: deleteTenant } = useDeleteTenant()
  const { mutate: restoreTenant } = useRestoreTenant()

  const tenants: Tenant[] = data?.data ?? []
  const meta = data?.meta

  return (
    <div>
      <Header title="Manajemen Tenant" description="Kelola semua brand F&B yang berlangganan LARIS">
        <Button asChild>
          <Link href="/superadmin/tenants/new">
            <Plus className="h-4 w-4 mr-2" />
            Tambah Tenant
          </Link>
        </Button>
      </Header>

      <div className="bg-card rounded-lg border">
        <div className="p-4 border-b flex gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Cari nama, email, slug..."
              className="pl-9"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            />
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Brand</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Plan</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Outlet</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                  Memuat data...
                </TableCell>
              </TableRow>
            ) : tenants.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                  Belum ada tenant.
                </TableCell>
              </TableRow>
            ) : (
              tenants.map((t) => (
                <TableRow key={t.id} className={t.deleted_at ? 'opacity-50' : ''}>
                  <TableCell className="font-medium">{t.name}</TableCell>
                  <TableCell className="text-muted-foreground font-mono text-sm">{t.slug}</TableCell>
                  <TableCell>{t.email}</TableCell>
                  <TableCell>{t.subscription_plan?.name ?? '—'}</TableCell>
                  <TableCell>
                    <Badge variant={statusVariant[t.subscription_status] ?? 'outline'}>
                      {t.subscription_status}
                    </Badge>
                  </TableCell>
                  <TableCell>{t.outlets_count ?? 0}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      {t.deleted_at ? (
                        <Button variant="ghost" size="icon" title="Pulihkan" onClick={() => restoreTenant(t.id)}>
                          <RefreshCw className="h-4 w-4" />
                        </Button>
                      ) : (
                        <>
                          <Button variant="ghost" size="icon" title="Edit" asChild>
                            <Link href={`/superadmin/tenants/${t.id}`}>
                              <Pencil className="h-4 w-4" />
                            </Link>
                          </Button>
                          <Button variant="ghost" size="icon" title="Hapus"
                            onClick={() => confirm('Hapus tenant ini?') && deleteTenant(t.id)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {meta && meta.last_page > 1 && (
          <div className="p-4 border-t flex items-center justify-between text-sm text-muted-foreground">
            <span>Total: {meta.total} tenant</span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
                Sebelumnya
              </Button>
              <span className="px-2 py-1">Hal. {meta.current_page} / {meta.last_page}</span>
              <Button variant="outline" size="sm" disabled={page >= meta.last_page} onClick={() => setPage(p => p + 1)}>
                Berikutnya
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
