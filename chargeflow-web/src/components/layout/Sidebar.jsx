import { NavLink } from 'react-router-dom'
import { LayoutDashboard, CalendarCheck, Activity, Bell, User, Zap, X, Sparkles } from 'lucide-react'

const items = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/bookings', label: 'My Bookings', icon: CalendarCheck },
  { to: '/session', label: 'Charging Sessions', icon: Activity },
  { to: '/notifications', label: 'Notifications', icon: Bell },
  { to: '/profile', label: 'Profile', icon: User },
]

const SIDEBAR_BORDER = 'border-r border-[rgba(255,255,255,0.05)]'

function SidebarContent({ onNavigate }) {
  return (
    <>
      <div
        className={`flex h-16 shrink-0 items-center gap-3 border-b border-[rgba(255,255,255,0.05)] px-5`}
      >
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white/5">
          <Zap className="h-5 w-5 text-[#FFDE42]" strokeWidth={2.5} />
        </div>
        <div className="min-w-0">
          <p className="truncate text-[15px] font-bold leading-tight text-white">ChargeFlow</p>
          <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-widest text-[rgba(255,255,255,0.45)]">
            EV Network
          </p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 overflow-auto px-3 py-6">
        <p className="mb-3 px-3 text-[10px] font-semibold uppercase tracking-wider text-[rgba(255,255,255,0.4)]">
          Main
        </p>
        {items.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={onNavigate}
            className={({ isActive }) =>
              `group flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-colors duration-200 ${
                isActive
                  ? 'bg-[#4C5C2D] text-white shadow-md shadow-black/25'
                  : 'text-[rgba(255,255,255,0.72)] hover:bg-[rgba(255,222,66,0.08)] hover:text-white'
              }`
            }
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-colors">
              <Icon className="h-[18px] w-[18px] text-[#FFDE42]" strokeWidth={2} />
            </span>
            <span className="min-w-0 flex-1 truncate">{label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="mx-3 mb-4 mt-auto shrink-0 rounded-xl bg-gradient-to-br from-[#FFDE42] to-[#C8A900] p-3.5 shadow-lg shadow-black/30">
        <div className="flex items-start gap-2">
          <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-black/15 text-[#1B0C0C]">
            <Sparkles className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-wide text-[#1B0C0C]">Pro</p>
            <p className="mt-0.5 text-xs font-semibold leading-snug text-[#1B0C0C]/90">20% off fast charging</p>
          </div>
        </div>
        <button
          type="button"
          className="mt-3 w-full rounded-lg bg-[#221414] py-2 text-[11px] font-semibold text-[#FFDE42] transition hover:bg-black"
        >
          Upgrade
        </button>
      </div>
    </>
  )
}

export default function Sidebar({ mobileOpen, onClose }) {
  return (
    <>
      <aside className={`hidden w-64 shrink-0 flex-col bg-[#221414] lg:flex ${SIDEBAR_BORDER}`}>
        <SidebarContent />
      </aside>

      <div className={`fixed inset-0 z-40 lg:hidden ${mobileOpen ? '' : 'pointer-events-none'}`}>
        <div
          className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-250 ${
            mobileOpen ? 'opacity-100' : 'opacity-0'
          }`}
          onClick={onClose}
          aria-hidden
        />
        <aside
          className={`absolute bottom-0 left-0 top-0 flex w-[min(100%,20rem)] flex-col bg-[#221414] shadow-2xl transition-transform duration-350 ${SIDEBAR_BORDER} ${
            mobileOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <button
            type="button"
            onClick={onClose}
            className="absolute right-3 top-3 rounded-lg p-2 text-[rgba(255,255,255,0.65)] transition hover:bg-white/10 hover:text-white"
            aria-label="Close menu"
          >
            <X className="h-4 w-4" />
          </button>
          <SidebarContent onNavigate={onClose} />
        </aside>
      </div>
    </>
  )
}
