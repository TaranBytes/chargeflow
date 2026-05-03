import { Search, Bell, Menu, Zap } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth.js'

export default function Navbar({ onMenuClick }) {
  const { user } = useAuth()
  const navigate = useNavigate()
  return (
    <header className="h-16 border-b border-slate-800 bg-slate-900/80 backdrop-blur flex items-center px-4 lg:px-6 gap-3 sticky top-0 z-20">
      <button
        onClick={onMenuClick}
        className="lg:hidden p-2 -ml-1 rounded-lg hover:bg-slate-800 text-slate-200"
        aria-label="Open menu"
      >
        <Menu className="w-5 h-5" />
      </button>

      <div className="lg:hidden flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 grid place-items-center text-white">
          <Zap className="w-4 h-4" />
        </div>
        <span className="font-bold text-slate-100">ChargeFlow</span>
      </div>

      <div className="flex-1 max-w-xl hidden md:block">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search stations, locations, chargers…"
            className="w-full bg-slate-800/80 hover:bg-slate-800 focus:bg-slate-800 border border-slate-700 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/20 rounded-lg pl-10 pr-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 outline-none transition"
          />
        </div>
      </div>

      <div className="flex-1 md:hidden" />

      <button
        onClick={() => navigate('/notifications')}
        className="relative p-2 rounded-lg hover:bg-slate-800"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5 text-slate-300" />
        <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-slate-900" />
      </button>

      <div className="flex items-center gap-3 pl-3 border-l border-slate-800">
        <img
          src={
            user?.avatar ||
            'https://api.dicebear.com/7.x/initials/svg?seed=U&backgroundColor=10b981'
          }
          alt={user?.name || 'User'}
          className="w-9 h-9 rounded-full bg-slate-700"
        />
        <div className="hidden sm:block leading-tight">
          <p className="text-sm font-semibold text-slate-100">{user?.name}</p>
          <p className="text-[11px] text-slate-400">{user?.email}</p>
        </div>
        <button
          onClick={() => navigate('/logout')}
          className="hidden sm:inline text-xs text-slate-400 hover:text-slate-100 ml-1"
        >
          Log out
        </button>
      </div>
    </header>
  )
}
