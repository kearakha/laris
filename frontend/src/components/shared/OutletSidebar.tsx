'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { BarChart2, CalendarCheck, ChefHat, DollarSign, FileText, LayoutGrid, LayoutDashboard, LogOut, Megaphone, Menu, MessageSquare, Package, Plug, Settings, Shield, ShoppingCart, Table2, Ticket, Trash2, Truck, Users, Wallet } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/lib/stores/authStore'
import { authApi } from '@/lib/api/auth'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'

const outletNav = [
  { href: '/outlet/pos', label: 'POS Kasir', icon: ShoppingCart },
  { href: '/outlet/kds', label: 'Dapur (KDS)', icon: ChefHat },
  { href: '/outlet/menu', label: 'Menu', icon: Menu },
  { href: '/outlet/tables', label: 'Meja', icon: Table2 },
  { href: '/outlet/inventory', label: 'Inventori', icon: Package },
  { href: '/outlet/vouchers', label: 'Voucher', icon: Ticket },
  { href: '/outlet/reservations', label: 'Reservasi', icon: CalendarCheck },
  { href: '/outlet/reviews', label: 'Ulasan', icon: MessageSquare },
  { href: '/outlet/employees', label: 'Karyawan', icon: Users },
  { href: '/outlet/analytics', label: 'Analitik', icon: BarChart2 },
  { href: '/outlet/waste', label: 'Waste & Spoilage', icon: Trash2 },
  { href: '/outlet/cash-drawer', label: 'Kas & Shift', icon: Wallet },
  { href: '/outlet/costing', label: 'HPP & Resep', icon: DollarSign },
  { href: '/outlet/floor-plan', label: 'Denah Meja', icon: LayoutGrid },
  { href: '/outlet/stock-transfers', label: 'Transfer Stok', icon: Truck },
  { href: '/outlet/reports', label: 'Laporan & Ekspor', icon: FileText },
  { href: '/outlet/marketplace', label: 'Marketplace', icon: Plug },
  { href: '/outlet/campaigns', label: 'Kampanye', icon: Megaphone },
  { href: '/outlet/audit-logs', label: 'Audit Log', icon: Shield },
  { href: '/outlet/settings', label: 'Pengaturan', icon: Settings },
]

export function OutletSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { user, logout } = useAuthStore()

  const handleLogout = async () => {
    try { await authApi.logout() } catch {}
    document.cookie = 'laris_token=; path=/; max-age=0'
    logout()
    router.push('/login')
    toast.success('Berhasil logout.')
  }

  return (
    <aside className="flex flex-col w-56 min-h-screen bg-card border-r">
      <div className="p-4">
        <div className="text-xl font-bold text-primary">LARIS</div>
        <div className="text-xs text-muted-foreground mt-0.5">Outlet</div>
      </div>

      <Separator />

      <nav className="flex-1 p-3 space-y-1">
        {outletNav.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
              pathname.startsWith(href)
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {label}
          </Link>
        ))}
      </nav>

      <div className="p-3 border-t">
        <div className="flex items-center gap-2 mb-2 px-1">
          <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary shrink-0">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium truncate">{user?.name}</p>
            <p className="text-xs text-muted-foreground truncate">{user?.roles?.[0]}</p>
          </div>
        </div>
        <Button variant="ghost" size="sm" className="w-full justify-start gap-2 text-muted-foreground text-xs" onClick={handleLogout}>
          <LogOut className="h-3 w-3" />
          Logout
        </Button>
      </div>
    </aside>
  )
}
