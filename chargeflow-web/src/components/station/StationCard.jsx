import { memo } from 'react'
import { Clock3, MapPin, Zap, Star, ArrowUpRight } from 'lucide-react'
import { Link } from 'react-router-dom'

function StationCard({ station, onClick, onHoverStart, onHoverEnd, active }) {
  const total = station.chargers.length
  const avail = station.chargers.filter((c) => c.status === 'AVAILABLE').length
  const maxKW = total ? Math.max(...station.chargers.map((c) => c.powerKW)) : 0

  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => onHoverStart?.(station)}
      onMouseLeave={() => onHoverEnd?.()}
      className={`
        group relative w-full overflow-hidden rounded-2xl border text-left transition-all duration-300
        ${
          active
            ? '-translate-y-1 border-[#FFDE42] bg-[rgba(255,255,255,0.04)] shadow-[0_0_0_1px_rgba(255,222,66,0.5),0_0_28px_-6px_rgba(255,222,66,0.35),0_16px_40px_-16px_rgba(0,0,0,0.55)]'
            : 'border-white/[0.06] bg-[rgba(255,255,255,0.025)] hover:-translate-y-1 hover:border-[#FFDE42] hover:shadow-[0_0_24px_-6px_rgba(255,222,66,0.4),0_12px_32px_-12px_rgba(0,0,0,0.45)]'
        }
      `}
    >
      <div className="relative p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1 pr-2">
            <h3 className="font-semibold leading-snug text-white">{station.name}</h3>
            <div className="mt-1.5 flex items-center gap-1.5 text-xs text-[rgba(255,255,255,0.65)]">
              <MapPin className="h-3.5 w-3.5 shrink-0 opacity-80" />
              <span className="truncate">
                {station.address.city}, {station.address.state}
              </span>
            </div>
          </div>
          <div
            className="
              flex shrink-0 items-center gap-1 rounded-full border border-[#FFDE42]
              bg-[rgba(0,0,0,0.2)] px-2.5 py-1 text-xs font-bold text-[#FFDE42]
            "
          >
            <Star className="h-3.5 w-3.5 fill-[#FFDE42] text-[#FFDE42]" />
            {station.rating}
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span
            className={`inline-flex items-center rounded-lg px-2.5 py-1 text-xs font-semibold ${
              avail > 0
                ? 'bg-[#4C5C2D] text-white'
                : 'bg-[#B44A4A]/25 text-red-100 ring-1 ring-[#B44A4A]/45'
            }`}
          >
            {avail}/{total} available
          </span>
          <span className="inline-flex items-center gap-1 rounded-lg bg-[#313E17] px-2.5 py-1 text-xs font-medium text-white">
            <Zap className="h-3 w-3 text-[#FFDE42]" />
            {maxKW} kW max
          </span>
          {station.averageChargeTimeMinutes ? (
            <span className="inline-flex items-center gap-1 rounded-lg bg-[rgba(255,255,255,0.05)] px-2.5 py-1 text-xs font-medium text-[rgba(255,255,255,0.72)]">
              <Clock3 className="h-3 w-3 opacity-80" />
              ~{station.averageChargeTimeMinutes} min
            </span>
          ) : null}
        </div>

        <div className="mt-4 flex items-center justify-between gap-3 border-t border-white/10 pt-4">
          <Link
            to={`/station/${station.id}`}
            onClick={(e) => e.stopPropagation()}
            className="
              inline-flex items-center gap-1.5 rounded-lg bg-[#FFDE42] px-3 py-2 text-xs font-semibold
              text-[#1B0C0C] transition duration-200 hover:bg-[#ffd000]
            "
          >
            View details
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
          <span className="text-[10px] font-medium uppercase tracking-wider text-[rgba(255,255,255,0.45)] group-hover:text-[rgba(255,255,255,0.65)]">
            Select
          </span>
        </div>
      </div>
    </button>
  )
}

function arePropsEqual(prev, next) {
  if (prev.active !== next.active) return false
  if (prev.onClick !== next.onClick) return false
  if (prev.onHoverStart !== next.onHoverStart) return false
  if (prev.onHoverEnd !== next.onHoverEnd) return false
  if (prev.station === next.station) return true
  if (prev.station?.id !== next.station?.id) return false
  if (prev.station?.name !== next.station?.name) return false
  if (prev.station?.rating !== next.station?.rating) return false
  if (prev.station?.chargers?.length !== next.station?.chargers?.length) return false
  const a = prev.station.chargers.map((c) => c.status).join('|')
  const b = next.station.chargers.map((c) => c.status).join('|')
  return a === b
}

export default memo(StationCard, arePropsEqual)
