import { OutletSidebar } from '@/components/shared/OutletSidebar'

export default function OutletLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <OutletSidebar />
      <main className="flex-1 overflow-auto bg-background">
        {children}
      </main>
    </div>
  )
}
