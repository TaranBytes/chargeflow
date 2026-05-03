import { memo } from 'react'
import { Clock3, MapPin, Zap, Star } from 'lucide-react'
import { Link } from 'react-router-dom'

function StationCard({ station, onClick, active }) {
  const total = station.chargers.length
  const avail = station.chargers.filter((c) => c.status === 'AVAILABLE').length
  const maxKW = total ? Math.max(...station.chargers.map((c) => c.powerKW)) : 0

  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-4 bg-white rounded-xl border transition-all ${
        active
          ? 'border-emerald-500 ring-2 ring-emerald-100'
          : 'border-slate-200 hover:border-slate-300 hover:shadow-sm'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-semibold text-slate-900 truncate">{station.name}</h3>
          <div className="flex items-center gap-1 text-xs text-slate-500 mt-0.5">
            <MapPin className="w-3 h-3 shrink-0" />
            <span className="truncate">
              {station.address.city}, {station.address.state}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1 text-xs font-semibold text-amber-600 shrink-0">
          <Star className="w-3 h-3 fill-amber-500 stroke-amber-500" />
          {station.rating}
        </div>
      </div>

      <div className="flex items-center gap-2 mt-3 flex-wrap">
        <div
          className={`text-xs font-medium px-2 py-1 rounded-md ${
            avail > 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
          }`}
        >
          {avail}/{total} available
        </div>
        <div className="text-xs font-medium px-2 py-1 rounded-md bg-slate-100 text-slate-700 inline-flex items-center gap-1">
          <Zap className="w-3 h-3" /> up to {maxKW}kW
        </div>
        {station.averageChargeTimeMinutes ? (
          <div className="text-xs font-medium px-2 py-1 rounded-md bg-indigo-50 text-indigo-700 inline-flex items-center gap-1">
            <Clock3 className="w-3 h-3" /> avg {station.averageChargeTimeMinutes} min
          </div>
        ) : null}
      </div>

      <Link
        to={`/station/${station.id}`}
        onClick={(e) => e.stopPropagation()}
        className="mt-3 inline-block text-xs font-semibold text-emerald-600 hover:underline"
      >
        View details →
      </Link>
    </button>
  )
}

// Skip re-render when nothing the card cares about has changed.
function arePropsEqual(prev, next) {
  if (prev.active !== next.active) return false
  if (prev.onClick !== next.onClick) return false
  if (prev.station === next.station) return true
  if (prev.station?.id !== next.station?.id) return false
  if (prev.station?.name !== next.station?.name) return false
  if (prev.station?.rating !== next.station?.rating) return false
  if (prev.station?.chargers?.length !== next.station?.chargers?.length) return false
  // Cheap charger-status fingerprint — short-circuits on equality.
  const a = prev.station.chargers.map((c) => c.status).join('|')
  const b = next.station.chargers.map((c) => c.status).join('|')
  return a === b
}

export default memo(StationCard, arePropsEqual)
