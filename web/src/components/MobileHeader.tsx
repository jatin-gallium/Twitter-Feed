import { useState } from 'react'
import { Link } from 'react-router-dom'

export function MobileHeader() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <header className="md:hidden fixed top-0 left-0 right-0 z-50 bg-[#eff4ff]/95 backdrop-blur-md shadow-[0_12px_40px_rgba(5,52,92,0.06)]">
        <div className="flex justify-between items-center px-4 py-3">
          <button
            type="button"
            className="text-on-surface p-1 rounded-lg hover:bg-white/60"
            aria-label="Open menu"
            onClick={() => setOpen((v) => !v)}
          >
            <span className="material-symbols-outlined text-2xl">menu</span>
          </button>
          <Link
            to="/"
            className="text-lg font-extrabold text-on-surface font-headline"
          >
            Precision Curator
          </Link>
          <span className="w-9" />
        </div>
        {open ? (
          <nav className="border-t border-outline-variant/20 px-4 py-3 flex flex-col gap-1 bg-surface-container-lowest/95">
            <MobileNavLink to="/" onNavigate={() => setOpen(false)}>
              Dashboard
            </MobileNavLink>
            <MobileNavLink to="/explorer" onNavigate={() => setOpen(false)}>
              Feed Explorer
            </MobileNavLink>
            <MobileNavLink to="/analytics" onNavigate={() => setOpen(false)}>
              Analytics
            </MobileNavLink>
            <MobileNavLink to="/upload" onNavigate={() => setOpen(false)}>
              Data Upload
            </MobileNavLink>
          </nav>
        ) : null}
      </header>
    </>
  )
}

function MobileNavLink({
  to,
  children,
  onNavigate,
}: {
  to: string
  children: React.ReactNode
  onNavigate: () => void
}) {
  return (
    <Link
      to={to}
      onClick={onNavigate}
      className="px-3 py-2 rounded-xl text-sm font-medium text-on-surface-variant hover:bg-surface-container-low"
    >
      {children}
    </Link>
  )
}
