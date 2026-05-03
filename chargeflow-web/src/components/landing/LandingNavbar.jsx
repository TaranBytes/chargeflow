import { m, useReducedMotion } from 'framer-motion'
import { Zap } from 'lucide-react'
import { Link } from 'react-router-dom'

const NAV_LINKS = [
  { id: 'network', label: 'Network' },
  { id: 'pricing', label: 'Pricing' },
  { id: 'features', label: 'Features' },
  { id: 'about', label: 'About' },
]

function scrollToId(id) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

export default function LandingNavbar({ onOpenLogin, onOpenSignup }) {
  const reduceMotion = useReducedMotion()

  return (
    <m.header
      className="fixed inset-x-0 top-0 z-50 border-b border-white/[0.06] bg-[#1B0C0C]/60 px-4 py-4 backdrop-blur-xl sm:px-6 lg:px-10"
      initial={reduceMotion ? false : { opacity: 0, y: -16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="mx-auto flex max-w-[1280px] items-center justify-between">
        {/* Left — Logo */}
        <Link to="/login" className="flex shrink-0 items-center gap-2.5">
          <div className="grid h-9 w-9 place-items-center rounded-lg border border-white/10 bg-white/[0.05]">
            <Zap className="h-4 w-4 text-[#FFDE42]" strokeWidth={2.5} />
          </div>
          <span className="text-lg font-bold tracking-tight text-white">ChargeFlow</span>
        </Link>

        {/* Center — Nav links */}
        <nav
          className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-1 md:flex"
          aria-label="Marketing"
        >
          {NAV_LINKS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => scrollToId(item.id)}
              className="rounded-lg px-3.5 py-2 text-[13px] font-medium text-white/50 transition-colors duration-200 hover:text-white"
            >
              {item.label}
            </button>
          ))}
        </nav>

        {/* Right — Auth buttons */}
        <div className="flex shrink-0 items-center gap-3">
          <button
            type="button"
            onClick={onOpenLogin}
            className="rounded-lg px-4 py-2 text-sm font-medium text-white/70 transition-colors duration-200 hover:text-white"
          >
            Login
          </button>
          <button
            type="button"
            onClick={onOpenSignup}
            className="rounded-lg border border-white/15 bg-white/[0.05] px-4 py-2 text-sm font-semibold text-white transition-all duration-200 hover:-translate-y-px hover:border-white/25 hover:bg-white/[0.08]"
          >
            Sign Up
          </button>
        </div>
      </div>
    </m.header>
  )
}
