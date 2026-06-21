'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Building2, CreditCard, LayoutDashboard, LogOut, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/lib/stores/authStore'
import { authApi } from '@/lib/api/auth'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'

const superAdminNav = [
  { href: '/superadmin/tenants', label: 'Tenant', icon: Building2 },
  { href: '/superadmin/plans', label: 'Subscription Plans', icon: CreditCard },
  { href: '/superadmin/settings', label: 'Pengaturan', icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { user, logout } = useAuthStore()

  const handleLogout = async () => {
    try {
      await authApi.logout()
    } catch {
      // ignore — clear locally anyway
    }
    document.cookie = 'laris_token=; path=/; max-age=0'
    logout()
    router.push('/login')
    toast.success('Berhasil logout.')
  }

  return (
    <aside className="flex flex-col w-64 min-h-screen bg-card border-r">
      <div className="p-6">
        <div className="text-2xl font-bold text-primary">LARIS</div>
        <div className="text-xs text-muted-foreground mt-1">Super Admin</div>
      </div>

      <Separator />

      <nav className="flex-1 p-4 space-y-1">
        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 mb-2">
          Menu
        </div>
        {superAdminNav.map(({ href, label, icon: Icon }) => (
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
            <Icon className="h-4 w-4" />
            {label}
          </Link>
        ))}
      </nav>

      <div className="p-4 border-t">
        <div className="flex items-center gap-3 mb-3 px-1">
          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{user?.name}</p>
            <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
          </div>
        </div>
        <Button variant="ghost" size="sm" className="w-full justify-start gap-2 text-muted-foreground" onClick={handleLogout}>
          <LogOut className="h-4 w-4" />
          Logout
        </Button>
      </div>
    </aside>
  )
}
