import { useState, useMemo } from 'react'
import MapView from '../components/map/MapView.jsx'
import StationCard from '../components/station/StationCard.jsx'
import { useStations } from '../hooks/useStations.js'
import { useGeolocation } from '../hooks/useGeolocation.js'
import {
  Filter,
  Search,
  Activity,
  Zap,
  MapPin,
  BatteryCharging,
  SearchX,
} from 'lucide-react'
import EmptyState from '../components/common/EmptyState.jsx'
import ErrorState from '../components/common/ErrorState.jsx'
import { StationCardSkeleton, MapSkeleton } from '../components/common/Skeleton.jsx'
import Button from '../components/common/Button.jsx'

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'available', label: 'Available' },
  { id: 'fast', label: 'Fast (50kW+)' },
  { id: 'ac', label: 'AC' },
]

export default function MapPage() {
  const { stations, loading, error, reload } = useStations()
  const { position } = useGeolocation()
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState('all')
  const [selected, setSelected] = useState(null)

  const filtered = useMemo(() => {
    let r = stations
    if (query.trim()) {
      const q = query.toLowerCase()
      r = r.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.address.city.toLowerCase().includes(q),
      )
    }
    if (filter === 'available')
      r = r.filter((s) => s.chargers.some((c) => c.status === 'AVAILABLE'))
    if (filter === 'fast')
      r = r.filter((s) => s.chargers.some((c) => c.powerKW >= 50))
    if (filter === 'ac')
      r = r.filter((s) => s.chargers.some((c) => c.type === 'AC'))
    return r
  }, [stations, query, filter])

  const stats = useMemo(() => {
    const totalChargers = stations.reduce((s, st) => s + st.chargers.length, 0)
    const available = stations.reduce(
      (s, st) => s + st.chargers.filter((c) => c.status === 'AVAILABLE').length,
      0,
    )
    return { stations: stations.length, totalChargers, available }
  }, [stations])

  const showEmpty = !loading && !error && filtered.length === 0
  const showNoData = !loading && !error && stations.length === 0
  const hasActiveFilter = query.trim() || filter !== 'all'

  return (
    <div className="p-4 lg:p-6 space-y-4">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-slate-900">Find a charger</h1>
        <p className="text-sm text-slate-500">
          Real-time station availability across your network.
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard icon={MapPin} label="Stations" value={loading ? '—' : stats.stations} accent="emerald" />
        <StatCard icon={BatteryCharging} label="Chargers" value={loading ? '—' : stats.totalChargers} accent="sky" />
        <StatCard icon={Zap} label="Available now" value={loading ? '—' : stats.available} accent="emerald" />
        <StatCard icon={Activity} label="Active sessions" value="3" accent="amber" />
      </div>

      <div className="grid lg:grid-cols-[420px_1fr] gap-4 h-[calc(100vh-280px)] min-h-[520px]">
        {/* List panel */}
        <div className="bg-white rounded-xl border border-slate-200 flex flex-col overflow-hidden">
          <div className="p-4 border-b border-slate-200 space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Search by station or city"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full bg-slate-100/60 hover:bg-slate-100 focus:bg-white border border-transparent focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100 rounded-lg pl-10 pr-3 py-2 text-sm outline-none transition"
              />
            </div>
            <div className="flex items-center gap-1.5 overflow-x-auto -mx-1 px-1">
              <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              {FILTERS.map((f) => (
                <button
                  key={f.id}
                  onClick={() => setFilter(f.id)}
                  className={`px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap transition ${
                    filter === f.id
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-auto p-3 space-y-2">
            {loading &&
              Array.from({ length: 4 }).map((_, i) => <StationCardSkeleton key={i} />)}

            {error && (
              <ErrorState
                title="Couldn't load stations"
                message={error.message}
                onRetry={reload}
              />
            )}

            {showNoData && (
              <EmptyState
                icon={MapPin}
                title="No stations available"
                description="There are no stations in your network yet."
              />
            )}

            {showEmpty && !showNoData && (
              <EmptyState
                icon={SearchX}
                title="No stations match"
                description={
                  hasActiveFilter
                    ? 'Try clearing the search or filters to see more results.'
                    : 'Try expanding your search.'
                }
                action={
                  hasActiveFilter ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setQuery('')
                        setFilter('all')
                      }}
                    >
                      Clear filters
                    </Button>
                  ) : null
                }
              />
            )}

            {!loading &&
              !error &&
              filtered.map((s) => (
                <StationCard
                  key={s.id}
                  station={s}
                  onClick={() => setSelected(s)}
                  active={selected?.id === s.id}
                />
              ))}
          </div>

          <div className="p-3 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
            <span className="inline-flex items-center gap-2">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" /> Available
            </span>
            <span className="inline-flex items-center gap-2">
              <span className="inline-block w-2 h-2 rounded-full bg-amber-500" /> Partial
            </span>
            <span className="inline-flex items-center gap-2">
              <span className="inline-block w-2 h-2 rounded-full bg-rose-500" /> Occupied
            </span>
          </div>
        </div>

        {/* Map panel */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          {loading ? (
            <MapSkeleton />
          ) : error ? (
            <div className="h-full grid place-items-center p-6">
              <ErrorState
                title="Map data unavailable"
                message={error.message}
                onRetry={reload}
              />
            </div>
          ) : (
            <MapView
              stations={filtered}
              center={position}
              onSelect={setSelected}
              selected={selected}
            />
          )}
        </div>
      </div>
    </div>
  )
}

function StatCard({ icon: Icon, label, value, accent = 'emerald' }) {
  const map = {
    emerald: 'bg-emerald-50 text-emerald-700',
    sky: 'bg-sky-50 text-sky-700',
    amber: 'bg-amber-50 text-amber-700',
  }
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-3">
      <div className={`w-10 h-10 rounded-lg grid place-items-center ${map[accent]}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-xs text-slate-500 font-medium">{label}</p>
        <p className="text-xl font-bold text-slate-900">{value}</p>
      </div>
    </div>
  )
}
