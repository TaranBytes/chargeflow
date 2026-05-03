import { useParams, Link } from 'react-router-dom'
import { useStation } from '../hooks/useStations.js'
import ChargerCard from '../components/charger/ChargerCard.jsx'
import { ArrowLeft, MapPin, Star, Clock, CheckCircle2 } from 'lucide-react'
import ErrorState from '../components/common/ErrorState.jsx'
import { Skeleton, ChargerCardSkeleton } from '../components/common/Skeleton.jsx'

export default function StationDetailPage() {
  const { id } = useParams()
  const { station, loading, error, reload } = useStation(id)

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-6xl mx-auto">
      <Link
        to="/"
        className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900"
      >
        <ArrowLeft className="w-4 h-4" /> Back to map
      </Link>

      {error && (
        <ErrorState
          title="Couldn't load station"
          message={
            error.status === 404
              ? 'We couldn’t find that station. It may have been removed.'
              : error.message
          }
          onRetry={error.status !== 404 ? reload : undefined}
        />
      )}

      {loading && <StationDetailSkeleton />}

      {!loading && !error && station && (
        <>
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <div className="aspect-[3/1] bg-slate-200 relative">
              {station.images?.[0] && (
                <img
                  src={station.images[0]}
                  alt={station.name}
                  className="w-full h-full object-cover"
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/70 via-slate-900/20 to-transparent" />
              <div className="absolute bottom-4 left-4 right-4 text-white">
                <div className="flex items-center gap-2 text-xs font-medium opacity-90">
                  <MapPin className="w-3 h-3" />
                  {station.address?.line1} · {station.address?.city}, {station.address?.state}
                </div>
                <h1 className="text-2xl font-bold mt-1">{station.name}</h1>
              </div>
            </div>

            <div className="p-5 grid sm:grid-cols-2 lg:grid-cols-4 gap-4 border-t border-slate-100">
              <Stat
                icon={CheckCircle2}
                label="Available"
                value={`${station.chargers.filter((c) => c.status === 'AVAILABLE').length} / ${station.chargers.length}`}
              />
              <Stat icon={Star} label="Rating" value={station.rating ?? '—'} />
              <Stat
                icon={Clock}
                label="Avg charge time"
                value={
                  station.averageChargeTimeMinutes
                    ? `${station.averageChargeTimeMinutes} min`
                    : '—'
                }
              />
              <Stat icon={Clock} label="Hours" value={station.operatingHours ?? '—'} />
            </div>

            <div className="px-5 pb-5">
              {station.description && (
                <p className="text-sm text-slate-600">{station.description}</p>
              )}
              {station.amenities?.length > 0 && (
                <div className="mt-4">
                  <p className="text-[11px] uppercase font-semibold text-slate-500 tracking-wide mb-2">
                    Amenities
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {station.amenities.map((a) => (
                      <span
                        key={a}
                        className="text-xs bg-slate-100 text-slate-700 rounded-full px-2.5 py-1"
                      >
                        {a}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-bold text-slate-900">Chargers</h2>
              <p className="text-xs text-slate-500">
                {station.chargers.filter((c) => c.status === 'AVAILABLE').length} of{' '}
                {station.chargers.length} ready now
              </p>
            </div>
            {station.chargers.length === 0 ? (
              <p className="text-sm text-slate-500">No chargers listed at this station.</p>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {station.chargers.map((c) => (
                  <ChargerCard key={c.id} charger={c} stationId={station.id} />
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}

function StationDetailSkeleton() {
  return (
    <>
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <Skeleton className="aspect-[3/1] w-full rounded-none" rounded="" />
        <div className="p-5 grid sm:grid-cols-3 gap-4 border-t border-slate-100">
          <Skeleton className="h-10 rounded-lg" />
          <Skeleton className="h-10 rounded-lg" />
          <Skeleton className="h-10 rounded-lg" />
        </div>
        <div className="px-5 pb-5 space-y-2">
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-3/4" />
        </div>
      </div>
      <div>
        <Skeleton className="h-5 w-24 mb-3" />
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <ChargerCardSkeleton />
          <ChargerCardSkeleton />
          <ChargerCardSkeleton />
        </div>
      </div>
    </>
  )
}

function Stat({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-700 grid place-items-center">
        <Icon className="w-4 h-4" />
      </div>
      <div>
        <p className="text-[11px] uppercase font-semibold text-slate-500 tracking-wide">{label}</p>
        <p className="text-sm font-semibold text-slate-900">{value}</p>
      </div>
    </div>
  )
}
