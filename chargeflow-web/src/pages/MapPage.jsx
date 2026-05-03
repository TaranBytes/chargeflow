import { useState, useMemo, useEffect, useDeferredValue, useCallback, useRef } from 'react'
import MapView from '../components/map/MapView.jsx'
import StationCard from '../components/station/StationCard.jsx'
import { useStations } from '../hooks/useStations.js'
import { useGeolocation } from '../hooks/useGeolocation.js'
import { useSocket } from '../hooks/useSocket.js'
import {
  Filter,
  Search,
  Activity,
  Zap,
  MapPin,
  BatteryCharging,
  SearchX,
  WifiOff,
  Map,
  List,
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

function useDebouncedValue(value, delay = 200) {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(t)
  }, [value, delay])
  return debounced
}

function useMediaQuery(query) {
  const [matches, setMatches] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia(query).matches : false,
  )
  useEffect(() => {
    const mq = window.matchMedia(query)
    const onChange = () => setMatches(mq.matches)
    onChange()
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [query])
  return matches
}

export default function MapPage() {
  const { stations, loading, error, reload } = useStations()
  const { position } = useGeolocation()
  const { connected } = useSocket() || {}

  const isMobile = useMediaQuery('(max-width: 767px)')

  const [query, setQuery] = useState('')
  const debouncedQuery = useDebouncedValue(query, 200)
  const [filter, setFilter] = useState('all')
  const [selected, setSelected] = useState(null)
  const [hoveredStation, setHoveredStation] = useState(null)
  const [mobileTab, setMobileTab] = useState('map')

  const deferredStations = useDeferredValue(stations)

  const onHoverStart = useCallback((s) => setHoveredStation(s), [])
  const onHoverEnd = useCallback(() => setHoveredStation(null), [])

  const prevIsMobile = useRef(null)
  useEffect(() => {
    if (prevIsMobile.current === false && isMobile) setMobileTab('map')
    prevIsMobile.current = isMobile
  }, [isMobile])

  const filtered = useMemo(() => {
    let r = deferredStations
    const q = debouncedQuery.trim().toLowerCase()
    if (q) {
      r = r.filter(
        (s) =>
          s.name.toLowerCase().includes(q) || s.address.city.toLowerCase().includes(q),
      )
    }
    if (filter === 'available')
      r = r.filter((s) => s.chargers.some((c) => c.status === 'AVAILABLE'))
    if (filter === 'fast') r = r.filter((s) => s.chargers.some((c) => c.powerKW >= 50))
    if (filter === 'ac') r = r.filter((s) => s.chargers.some((c) => c.type === 'AC'))
    return r
  }, [deferredStations, debouncedQuery, filter])

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

  const listChrome = (
    <>
      <div className="space-y-4 border-b border-white/10 px-4 py-4 sm:px-5">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#666666]" />
          <input
            type="text"
            placeholder="Search by station or city"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="
              w-full rounded-xl border border-black/10 bg-white py-3 pl-10 pr-3
              text-sm text-[#1B0C0C] placeholder:text-[#666666] outline-none transition duration-200
              focus:border-[#4C5C2D] focus:ring-2 focus:ring-[#FFDE42]/22
            "
          />
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <Filter className="h-3.5 w-3.5 shrink-0 text-[rgba(255,255,255,0.45)]" aria-hidden />
          {FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilter(f.id)}
              className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition duration-200 ${
                filter === f.id
                  ? 'bg-[#4C5C2D] text-white shadow-md shadow-black/15'
                  : 'bg-[rgba(255,255,255,0.05)] text-[rgba(255,255,255,0.72)] hover:bg-[rgba(255,255,255,0.08)] hover:text-white'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div
        className="
          cf-scroll-panel min-h-0 flex-1 space-y-3 overflow-y-auto overflow-x-hidden px-4 py-4
          sm:px-5
        "
      >
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
              onHoverStart={onHoverStart}
              onHoverEnd={onHoverEnd}
              active={selected?.id === s.id}
            />
          ))}
      </div>

      <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-white/10 px-4 py-3 text-[11px] text-[rgba(255,255,255,0.65)] sm:px-5">
        <span className="inline-flex items-center gap-2">
          <span className="inline-block h-2 w-2 rounded-full bg-[#4C5C2D] shadow-[0_0_10px_rgba(76,92,45,0.65)]" />
          Available
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="inline-block h-2 w-2 rounded-full bg-[#FFDE42] shadow-[0_0_10px_rgba(255,222,66,0.45)]" />
          Busy
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="inline-block h-2 w-2 rounded-full bg-[#B44A4A]" /> Offline
        </span>
      </div>
    </>
  )

  const mapShell = (
    <div
      className="
        relative h-full min-h-0 w-full min-w-0 overflow-hidden rounded-3xl
        border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.04)] shadow-xl shadow-black/25
      "
    >
      <div className="pointer-events-none absolute inset-0 z-[400] rounded-3xl ring-1 ring-inset ring-white/[0.04]" />
      {loading ? (
        <MapSkeleton />
      ) : error ? (
        <div className="grid h-full min-h-[12rem] place-items-center p-8">
          <ErrorState title="Map data unavailable" message={error.message} onRetry={reload} />
        </div>
      ) : (
        <MapView
          stations={filtered}
          center={position}
          onSelect={setSelected}
          selected={selected}
          hoveredStation={hoveredStation}
        />
      )}
    </div>
  )

  return (
    <div className="flex min-h-0 w-full max-w-[1920px] flex-1 flex-col gap-4 lg:mx-auto lg:gap-6">
      <header
        className="
          relative shrink-0 overflow-hidden rounded-2xl border border-[rgba(255,255,255,0.08)]
          bg-[rgba(255,255,255,0.04)] px-4 py-3 backdrop-blur-xl sm:px-6 sm:py-4
        "
      >
        <div className="relative flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0 space-y-1">
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <h1 className="text-xl font-bold tracking-tight text-white sm:text-2xl lg:text-[1.75rem]">
                EV charging network
              </h1>
              <LiveDot connected={connected} />
            </div>
            <p className="max-w-2xl text-xs leading-relaxed text-[rgba(255,255,255,0.72)] sm:text-sm">
              Live availability and session-ready stations — browse the map or list without losing context.
            </p>
          </div>
          <div className="flex shrink-0 gap-2 overflow-x-auto pb-0.5 sm:gap-3 sm:pb-0">
            <MiniStat variant="gold" icon={MapPin} label="Stations" value={loading ? '—' : stats.stations} />
            <MiniStat
              variant="moss"
              icon={BatteryCharging}
              label="Chargers"
              value={loading ? '—' : stats.totalChargers}
            />
            <MiniStat variant="fern" icon={Zap} label="Available" value={loading ? '—' : stats.available} />
            <MiniStat variant="frost" icon={Activity} label="Sessions" value="3" />
          </div>
        </div>
      </header>

      {isMobile ? (
        <div
          className="flex shrink-0 gap-1 rounded-2xl border border-white/10 bg-[rgba(0,0,0,0.15)] p-1 backdrop-blur-md"
          role="tablist"
          aria-label="Map or station list"
        >
          <TabButton
            active={mobileTab === 'map'}
            onClick={() => setMobileTab('map')}
            icon={Map}
            label="Map"
          />
          <TabButton
            active={mobileTab === 'list'}
            onClick={() => setMobileTab('list')}
            icon={List}
            label="Stations"
          />
        </div>
      ) : null}

      <div
        className="
          flex min-h-0 flex-1 flex-col gap-4 transition-[gap] duration-200
          md:gap-5 lg:flex-row lg:gap-6
        "
      >
        <section
          className={`
            flex min-h-0 flex-col overflow-hidden rounded-3xl border border-white/10 bg-[rgba(0,0,0,0.22)]
            shadow-xl shadow-black/20 backdrop-blur-sm
            ${isMobile && mobileTab !== 'list' ? 'hidden' : ''}
            ${isMobile && mobileTab === 'list' ? 'min-h-0 flex-1' : ''}
            md:flex md:min-h-0 md:flex-1 lg:w-[38%] lg:min-w-[280px] lg:max-w-[40%] lg:flex-none lg:shrink-0
            max-lg:order-2
          `}
        >
          {listChrome}
        </section>

        <section
          className={`
            flex min-h-0 min-w-0 flex-col overflow-hidden
            ${isMobile && mobileTab !== 'map' ? 'hidden' : ''}
            ${isMobile && mobileTab === 'map' ? 'min-h-0 flex-1' : ''}
            md:flex md:min-h-0 md:flex-1 md:max-lg:order-1 md:max-lg:min-h-[min(42vh,22rem)] md:max-lg:shrink-0
            lg:order-2 lg:min-h-0 lg:flex-1
          `}
        >
          {mapShell}
        </section>
      </div>
    </div>
  )
}

function TabButton({ active, onClick, icon: Icon, label }) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={`
        flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold transition duration-200
        ${
          active
            ? 'bg-[#4C5C2D] text-white shadow-md shadow-black/15'
            : 'text-[rgba(255,255,255,0.65)] hover:bg-white/5 hover:text-white'
        }
      `}
    >
      <Icon className="h-4 w-4" strokeWidth={2} />
      {label}
    </button>
  )
}

function LiveDot({ connected }) {
  if (connected === undefined) return null
  return connected ? (
    <span
      className="
        inline-flex items-center gap-2 rounded-full bg-[#FFDE42] px-2.5 py-0.5 text-[10px] font-bold
        uppercase tracking-wide text-[#1B0C0C] sm:px-3 sm:text-[11px]
      "
    >
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#1B0C0C] opacity-35" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-[#1B0C0C]" />
      </span>
      Live
    </span>
  ) : (
    <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/25 px-2.5 py-0.5 text-[10px] font-semibold text-[rgba(255,255,255,0.72)] sm:px-3 sm:text-[11px]">
      <WifiOff className="h-3 w-3" />
      Offline
    </span>
  )
}

const MINI_STAT_BORDER = {
  gold: 'border-l-[#FFDE42] shadow-[0_0_20px_-10px_rgba(255,222,66,0.35)]',
  moss: 'border-l-[#4C5C2D] shadow-[0_0_18px_-10px_rgba(76,92,45,0.45)]',
  fern: 'border-l-[#6D8A33] shadow-[0_0_22px_-10px_rgba(109,138,51,0.35)]',
  frost: 'border-l-[rgba(255,255,255,0.35)] shadow-[0_0_16px_-10px_rgba(255,255,255,0.12)]',
}

function MiniStat({ icon: Icon, label, value, variant }) {
  const b = MINI_STAT_BORDER[variant] || MINI_STAT_BORDER.gold
  return (
    <div
      className={`
        group flex min-w-[5.5rem] items-center gap-2 rounded-xl border border-white/[0.06] bg-[rgba(255,255,255,0.03)]
        py-2 pl-3 pr-3 transition duration-200 hover:bg-[rgba(255,255,255,0.05)] sm:min-w-0 sm:pl-3.5
        border-l-4 ${b}
      `}
    >
      <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-white/[0.06] text-[#FFDE42]">
        <Icon className="h-4 w-4 opacity-95" strokeWidth={2} />
      </div>
      <div className="min-w-0 leading-tight">
        <p className="text-lg font-bold tabular-nums tracking-tight text-white">{value}</p>
        <p className="text-[10px] font-semibold uppercase tracking-wider text-[rgba(255,255,255,0.72)]">
          {label}
        </p>
      </div>
    </div>
  )
}
