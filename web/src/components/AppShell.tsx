import { Outlet } from 'react-router-dom'
import { SideNav } from '@/components/SideNav'
import { MobileHeader } from '@/components/MobileHeader'

export function AppShell() {
  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-background text-on-surface font-body">
      <MobileHeader />
      <SideNav />
      <div className="flex-1 md:ml-64 flex flex-col min-h-screen pt-[56px] md:pt-0">
        <Outlet />
      </div>
    </div>
  )
}
