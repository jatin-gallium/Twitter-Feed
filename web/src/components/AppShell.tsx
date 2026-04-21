import { useCallback, useState } from 'react'
import { Outlet } from 'react-router-dom'
import { SideNav } from '@/components/SideNav'
import { MobileHeader } from '@/components/MobileHeader'
import { readMainNavCollapsed, writeMainNavCollapsed } from '@/lib/layoutPrefs'

export function AppShell() {
  const [mainNavCollapsed, setMainNavCollapsed] = useState(
    () => readMainNavCollapsed(),
  )

  const toggleMainNav = useCallback(() => {
    setMainNavCollapsed((v) => {
      const next = !v
      writeMainNavCollapsed(next)
      return next
    })
  }, [])

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-background text-on-surface font-body">
      <MobileHeader />
      <SideNav collapsed={mainNavCollapsed} onToggleCollapsed={toggleMainNav} />
      <div
        className={`flex-1 flex flex-col min-h-0 h-[calc(100dvh-56px)] md:h-screen overflow-hidden pt-[56px] md:pt-0 transition-[margin] duration-200 ease-out ${
          mainNavCollapsed ? 'md:ml-[4.5rem]' : 'md:ml-64'
        }`}
      >
        <Outlet />
      </div>
    </div>
  )
}
