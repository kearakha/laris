import { Sidebar } from '@/components/shared/Sidebar'

export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 p-8 overflow-auto bg-muted/20">
        {children}
      </main>
    </div>
  )
}
