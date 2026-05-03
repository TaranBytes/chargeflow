import { NavLink } from 'react-router-dom'
import { LayoutDashboard, CalendarCheck, Activity, Bell, User, Zap, X } from 'lucide-react'

const items = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/bookings', label: 'My Bookings', icon: CalendarCheck },
  { to: '/session', label: 'Charging Sessions', icon: Activity },
  { to: '/notifications', label: 'Notifications', icon: Bell },
  { to: '/profile', label: 'Profile', icon: User },
]

function SidebarContent({ onNavigate }) {
  return (
    <>
      <div className="flex items-center gap-2.5 px-6 h-16 border-b border-slate-800">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-cyan-500 grid place-items-center text-white shadow-md shadow-emerald-900/40">
          <Zap className="w-5 h-5" strokeWidth={2.5} />
        </div>
        <div>
          <p className="text-base font-bold text-slate-100 leading-none">ChargeFlow</p>
          <p className="text-[10px] text-slate-400 mt-1 tracking-wide uppercase">EV Network</p>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-auto">
        <p className="px-3 pb-2 text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Main</p>
        {items.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={onNavigate}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-emerald-500/15 text-emerald-300'
                  : 'text-slate-300 hover:bg-slate-800/70 hover:text-slate-100'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-300' : 'text-slate-500'}`} />
                <span>{label}</span>
                {isActive && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-emerald-500" />}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="m-3 p-4 rounded-xl bg-gradient-to-br from-emerald-500/90 to-cyan-600/90 text-white relative overflow-hidden border border-emerald-400/20">
        <div className="absolute -right-6 -top-6 w-24 h-24 rounded-full bg-white/10" />
        <p className="text-[10px] uppercase tracking-wider font-semibold opacity-80 relative">Pro</p>
        <p className="text-sm font-semibold mt-1 relative">Save 20% on DC fast charging</p>
        <button className="mt-3 w-full rounded-lg bg-white/15 hover:bg-white/25 backdrop-blur text-xs font-medium py-1.5 transition relative">
          Upgrade →
        </button>
      </div>
    </>
  )
}

export default function Sidebar({ mobileOpen, onClose }) {
  return (
    <>
      {/* Desktop */}
      <aside className="hidden lg:flex w-64 shrink-0 flex-col bg-slate-900/95 border-r border-slate-800 backdrop-blur">
        <SidebarContent />
      </aside>

      {/* Mobile drawer */}
      <div className={`lg:hidden fixed inset-0 z-40 ${mobileOpen ? '' : 'pointer-events-none'}`}>
        <div
          className={`absolute inset-0 bg-slate-950/70 transition-opacity ${
            mobileOpen ? 'opacity-100' : 'opacity-0'
          }`}
          onClick={onClose}
        />
        <aside
          className={`absolute left-0 top-0 bottom-0 w-72 bg-slate-900 flex flex-col shadow-xl border-r border-slate-800 transition-transform ${
            mobileOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-md hover:bg-slate-800 text-slate-300"
            aria-label="Close menu"
          >
            <X className="w-4 h-4" />
          </button>
          <SidebarContent onNavigate={onClose} />
        </aside>
      </div>
    </>
  )
}
