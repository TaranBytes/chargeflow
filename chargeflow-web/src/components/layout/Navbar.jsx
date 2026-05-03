import { Search, Bell, Menu, Zap } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth.js'

export default function Navbar({ onMenuClick }) {
  const { user } = useAuth()
  const navigate = useNavigate()

  const inputClass = `
    w-full rounded-xl border border-black/8 bg-[rgba(255,255,255,0.92)] py-2.5 pl-10 pr-4
    text-sm text-[#1B0C0C] placeholder:text-[#666666]
    outline-none transition duration-200
    focus:border-[#4C5C2D] focus:ring-2 focus:ring-[#FFDE42]/20
  `

  return (
    <header
      className="
        relative z-20 flex min-h-14 items-center gap-3 rounded-2xl border border-[rgba(255,255,255,0.06)]
        bg-[rgba(255,255,255,0.04)] px-3 py-2.5 shadow-lg shadow-black/20 backdrop-blur-xl
        sm:min-h-[3.5rem] sm:px-4 lg:px-6
      "
    >
      <div className="flex min-w-0 shrink-0 items-center gap-2 sm:gap-3 lg:w-[200px]">
        <button
          type="button"
          onClick={onMenuClick}
          className="rounded-xl p-2 text-[#FFDE42] transition hover:bg-white/5 lg:hidden"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div className="flex items-center gap-2">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white/5">
            <Zap className="h-4 w-4 text-[#FFDE42]" strokeWidth={2.5} />
          </div>
          <span className="hidden max-w-[7rem] truncate font-bold tracking-tight text-white sm:inline">
            ChargeFlow
          </span>
        </div>
      </div>

      <div className="absolute left-1/2 top-1/2 hidden w-[min(100%,28rem)] -translate-x-1/2 -translate-y-1/2 md:block">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#666666]" />
          <input
            type="text"
            placeholder="Search stations, cities, chargers…"
            className={inputClass}
          />
        </div>
      </div>

      <div className="relative min-w-0 flex-1 md:hidden">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#666666]" />
        <input type="text" placeholder="Search…" className={`${inputClass} py-2 pl-9 pr-3`} />
      </div>

      <div className="hidden flex-1 md:block lg:max-w-[200px]" aria-hidden />

      <div className="ml-auto flex shrink-0 items-center gap-2 sm:gap-3 lg:gap-4">
        <button
          type="button"
          onClick={() => navigate('/notifications')}
          className="relative grid h-10 w-10 place-items-center rounded-xl text-[#FFDE42] transition hover:bg-white/5"
          aria-label="Notifications"
        >
          <Bell className="h-5 w-5" />
          <span className="absolute right-2 top-2 flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-badge-ping rounded-full bg-[#FFDE42] opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-[#FFDE42] ring-2 ring-[#1B0C0C]" />
          </span>
        </button>

        <div className="hidden h-8 w-px shrink-0 bg-white/10 sm:block" />

        <div className="flex min-w-0 max-w-[200px] items-center gap-3 sm:max-w-none sm:gap-4">
          <img
            src={
              user?.avatar ||
              'https://api.dicebear.com/7.x/initials/svg?seed=U&backgroundColor=4c5c2d'
            }
            alt={user?.name || 'User'}
            className="h-10 w-10 shrink-0 rounded-full border-2 border-[#4C5C2D] object-cover"
          />
          <div className="hidden min-w-0 leading-tight sm:block">
            <p className="truncate text-sm font-semibold text-white">{user?.name}</p>
            <p className="truncate text-[11px] text-[rgba(255,255,255,0.72)]">{user?.email}</p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/logout')}
            className="
              hidden shrink-0 rounded-lg border border-[#FFDE42] bg-transparent px-3 py-1.5
              text-xs font-medium text-[#FFDE42] transition hover:bg-[rgba(255,222,66,0.08)]
              sm:inline
            "
          >
            Log out
          </button>
        </div>
      </div>
    </header>
  )
}
