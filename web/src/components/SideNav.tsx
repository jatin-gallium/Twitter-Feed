import { NavLink } from 'react-router-dom'

const linkBase =
  'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200'
const inactive =
  'text-on-surface-variant hover:bg-[#eff4ff] hover:translate-x-0.5'
const active =
  'bg-white text-primary font-bold shadow-[0_4px_12px_rgba(5,52,92,0.04)]'

export function SideNav() {
  return (
    <nav className="hidden md:flex flex-col p-6 space-y-2 h-screen w-64 fixed left-0 top-0 z-40 bg-[#eff4ff]">
      <div className="mb-8">
        <h1 className="text-lg font-bold text-on-surface font-headline">
          The Atelier
        </h1>
        <p className="text-xs text-on-surface-variant font-label tracking-wide uppercase opacity-80 mt-1">
          Editorial Intelligence
        </p>
      </div>
      <div className="flex-1 space-y-2 font-label">
        <NavLink
          to="/"
          end
          className={({ isActive }) =>
            `${linkBase} ${isActive ? active : inactive}`
          }
        >
          {({ isActive }) => (
            <>
              <span
                className={`material-symbols-outlined ${isActive ? 'filled' : ''}`}
              >
                dashboard
              </span>
              <span>Dashboard</span>
            </>
          )}
        </NavLink>
        <NavLink
          to="/explorer"
          className={({ isActive }) =>
            `${linkBase} ${isActive ? active : inactive}`
          }
        >
          {({ isActive }) => (
            <>
              <span
                className={`material-symbols-outlined ${isActive ? 'filled' : ''}`}
              >
                explore
              </span>
              <span>Feed Explorer</span>
            </>
          )}
        </NavLink>
        <NavLink
          to="/analytics"
          className={({ isActive }) =>
            `${linkBase} ${isActive ? active : inactive}`
          }
        >
          {({ isActive }) => (
            <>
              <span
                className={`material-symbols-outlined ${isActive ? 'filled' : ''}`}
              >
                query_stats
              </span>
              <span>Analytics</span>
            </>
          )}
        </NavLink>
        <NavLink
          to="/upload"
          className={({ isActive }) =>
            `${linkBase} ${isActive ? active : inactive}`
          }
        >
          {({ isActive }) => (
            <>
              <span
                className={`material-symbols-outlined ${isActive ? 'filled' : ''}`}
              >
                cloud_upload
              </span>
              <span>Data Upload</span>
            </>
          )}
        </NavLink>
      </div>
      <div className="mt-auto pt-6 flex items-center gap-3 text-on-surface-variant px-2">
        <div className="w-9 h-9 rounded-full bg-surface-container-high flex items-center justify-center text-primary text-sm font-bold">
          C
        </div>
        <div className="flex flex-col min-w-0">
          <span className="text-sm font-medium text-on-surface truncate">
            Curator
          </span>
          <span className="text-xs truncate">Local session</span>
        </div>
      </div>
    </nav>
  )
}
