import { NavLink } from 'react-router-dom'

const linkBase =
  'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200'
const inactive =
  'text-on-surface-variant hover:bg-[#eff4ff] hover:translate-x-0.5'
const active =
  'bg-white text-primary font-bold shadow-[0_4px_12px_rgba(5,52,92,0.04)]'

type Props = {
  collapsed: boolean
  onToggleCollapsed: () => void
}

export function SideNav({ collapsed, onToggleCollapsed }: Props) {
  return (
    <nav
      className={`hidden md:flex flex-col h-screen fixed left-0 top-0 z-40 bg-[#eff4ff] transition-[width,padding] duration-200 ease-out ${
        collapsed ? 'w-[4.5rem] p-2 items-center' : 'w-64 p-6 space-y-2'
      }`}
    >
      <div className={`w-full shrink-0 ${collapsed ? 'flex justify-center mb-2' : 'mb-8'}`}>
        <button
          type="button"
          onClick={onToggleCollapsed}
          className="p-2 rounded-xl text-on-surface-variant hover:bg-white/80 hover:text-primary transition-colors"
          title={collapsed ? 'Expand sidebar' : 'Minimize sidebar'}
          aria-expanded={!collapsed}
          aria-label={collapsed ? 'Expand sidebar' : 'Minimize sidebar'}
        >
          <span className="material-symbols-outlined text-2xl">
            {collapsed ? 'keyboard_double_arrow_right' : 'keyboard_double_arrow_left'}
          </span>
        </button>
      </div>

      {!collapsed ? (
        <div className="mb-8">
          <h1 className="text-lg font-bold text-on-surface font-headline">
            The Atelier
          </h1>
          <p className="text-xs text-on-surface-variant font-label tracking-wide uppercase opacity-80 mt-1">
            Editorial Intelligence
          </p>
        </div>
      ) : (
        <div
          className="mb-4 w-9 h-9 rounded-full bg-surface-container-high flex items-center justify-center text-primary text-xs font-bold shrink-0"
          title="The Atelier"
        >
          A
        </div>
      )}

      <div
        className={`flex-1 space-y-2 font-label w-full ${collapsed ? 'flex flex-col items-center' : ''}`}
      >
        <NavItem
          to="/"
          end
          icon="dashboard"
          label="Dashboard"
          collapsed={collapsed}
        />
        <NavItem
          to="/explorer"
          icon="explore"
          label="Feed Explorer"
          collapsed={collapsed}
        />
        <NavItem
          to="/analytics"
          icon="query_stats"
          label="Analytics"
          collapsed={collapsed}
        />
        <NavItem
          to="/upload"
          icon="cloud_upload"
          label="Data Upload"
          collapsed={collapsed}
        />
      </div>

      <div
        className={`mt-auto pt-6 flex text-on-surface-variant shrink-0 ${
          collapsed ? 'flex-col items-center gap-2 px-0' : 'items-center gap-3 px-2'
        }`}
      >
        <div className="w-9 h-9 rounded-full bg-surface-container-high flex items-center justify-center text-primary text-sm font-bold shrink-0">
          C
        </div>
        {!collapsed ? (
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-medium text-on-surface truncate">
              Curator
            </span>
            <span className="text-xs truncate">Local session</span>
          </div>
        ) : null}
      </div>
    </nav>
  )
}

function NavItem({
  to,
  end,
  icon,
  label,
  collapsed,
}: {
  to: string
  end?: boolean
  icon: string
  label: string
  collapsed: boolean
}) {
  return (
    <NavLink
      to={to}
      end={end}
      title={label}
      className={({ isActive }) =>
        `${linkBase} ${isActive ? active : inactive} ${
          collapsed ? '!px-2 !py-3 justify-center !gap-0 w-full max-w-[2.75rem]' : ''
        }`
      }
    >
      {({ isActive }) => (
        <>
          <span
            className={`material-symbols-outlined shrink-0 ${isActive ? 'filled' : ''}`}
          >
            {icon}
          </span>
          <span className={collapsed ? 'sr-only' : ''}>{label}</span>
        </>
      )}
    </NavLink>
  )
}
