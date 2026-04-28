import { useEffect, useState, useMemo } from 'react'
import { useParams, useSearchParams, useNavigate, Link } from 'react-router-dom'
import SlotPicker from '../components/booking/SlotPicker.jsx'
import StatusBadge from '../components/common/StatusBadge.jsx'
import Button from '../components/common/Button.jsx'
import EmptyState from '../components/common/EmptyState.jsx'
import ErrorState from '../components/common/ErrorState.jsx'
import { Skeleton } from '../components/common/Skeleton.jsx'
import { stationApi } from '../api/station.api.js'
import { bookingApi } from '../api/booking.api.js'
import { useToast } from '../hooks/useToast.js'
import {
  Zap,
  IndianRupee,
  MapPin,
  CalendarCheck,
  Clock,
  AlertCircle,
  MapPinOff,
} from 'lucide-react'

function validate({ slot, charger, duration }) {
  const errors = {}
  if (!charger) errors.charger = 'Pick a charger first.'
  else if (charger.status !== 'AVAILABLE') errors.charger = 'This charger is not available right now.'
  if (!slot) errors.slot = 'Choose a start time.'
  if (!duration || duration <= 0) errors.duration = 'Select a duration.'
  return errors
}

export default function BookingPage() {
  const { chargerId } = useParams()
  const [searchParams] = useSearchParams()
  const stationId = searchParams.get('station')
  const navigate = useNavigate()
  const toast = useToast()

  const [station, setStation] = useState(null)
  const [charger, setCharger] = useState(null)
  const [loadError, setLoadError] = useState(null)
  const [loading, setLoading] = useState(Boolean(stationId))

  const [slot, setSlot] = useState(null)
  const [duration, setDuration] = useState(30)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState(null)
  const [confirmed, setConfirmed] = useState(null)

  const fetchStation = () => {
    if (!stationId) return
    setLoading(true)
    setLoadError(null)
    stationApi
      .getById(stationId)
      .then((s) => {
        setStation(s)
        const c =
          s.chargers.find((x) => x.id === chargerId) ||
          s.chargers.find((x) => x.status === 'AVAILABLE') ||
          s.chargers[0]
        setCharger(c)
      })
      .catch((err) => setLoadError(err))
      .finally(() => setLoading(false))
  }

  useEffect(fetchStation, [stationId, chargerId]) // eslint-disable-line react-hooks/exhaustive-deps

  const estKWh = useMemo(
    () => (charger ? ((charger.powerKW * duration) / 60) * 0.85 : 0),
    [charger, duration],
  )
  const estCost = useMemo(
    () => (charger ? estKWh * charger.pricePerKWh : 0),
    [charger, estKWh],
  )

  const errors = validate({ slot, charger, duration })
  const canSubmit = Object.keys(errors).length === 0

  const handleConfirm = async () => {
    setSubmitError(null)
    if (!canSubmit) {
      toast.warning('Missing info', Object.values(errors)[0])
      return
    }
    setSubmitting(true)
    try {
      const endTime = new Date(slot.start.getTime() + duration * 60 * 1000)
      const booking = await bookingApi.create({
        stationId: station.id,
        stationName: station.name,
        chargerId: charger.id,
        chargerName: `${charger.ocppId} · ${charger.type} ${charger.powerKW}kW`,
        startTime: slot.start.toISOString(),
        endTime: endTime.toISOString(),
        estimatedKWh: Number(estKWh.toFixed(1)),
        estimatedCost: Number(estCost.toFixed(0)),
      })
      setConfirmed(booking)
      toast.success('Booking confirmed', `${booking.chargerName} reserved.`)
    } catch (err) {
      const msg = err?.message || 'Could not create booking. Please try again.'
      setSubmitError(msg)
      toast.error('Booking failed', msg)
    } finally {
      setSubmitting(false)
    }
  }

  // Hard guard: opened /booking with no station param
  if (!stationId) {
    return (
      <div className="p-6 max-w-md mx-auto mt-12">
        <EmptyState
          icon={MapPinOff}
          title="Pick a charger first"
          description="Choose a station and an available charger from the map to start a booking."
          action={
            <Button onClick={() => navigate('/')} size="md">
              Open map
            </Button>
          }
        />
      </div>
    )
  }

  if (loadError) {
    return (
      <div className="p-6 max-w-xl mx-auto">
        <ErrorState
          title="Couldn't load this station"
          message={loadError.message}
          onRetry={fetchStation}
        />
        <div className="mt-3 text-center">
          <Link to="/" className="text-xs text-slate-500 hover:text-slate-900">
            ← Back to map
          </Link>
        </div>
      </div>
    )
  }

  if (loading) {
    return <BookingPageSkeleton />
  }

  if (!station || !charger) {
    return (
      <div className="p-6 max-w-md mx-auto mt-12">
        <EmptyState
          icon={MapPinOff}
          title="Charger not found"
          description="The charger you’re trying to book may have been removed."
          action={
            <Button variant="outline" size="md" onClick={() => navigate('/')}>
              Back to map
            </Button>
          }
        />
      </div>
    )
  }

  if (confirmed) {
    return (
      <div className="p-6 max-w-lg mx-auto">
        <div className="bg-white border border-emerald-200 rounded-2xl p-8 text-center shadow-sm">
          <div className="w-14 h-14 rounded-full bg-emerald-100 grid place-items-center mx-auto">
            <CalendarCheck className="w-7 h-7 text-emerald-600" />
          </div>
          <h2 className="mt-4 text-xl font-bold text-slate-900">Booking confirmed!</h2>
          <p className="text-sm text-slate-500 mt-1">
            {confirmed.stationName} · {confirmed.chargerName}
          </p>
          <p className="text-sm text-slate-700 mt-3 inline-flex items-center gap-1.5">
            <Clock className="w-4 h-4" />
            {new Date(confirmed.startTime).toLocaleString()}
          </p>
          <div className="flex gap-3 mt-6">
            <Button fullWidth onClick={() => navigate('/bookings')}>
              View bookings
            </Button>
            <Button fullWidth variant="subtle" onClick={() => navigate('/')}>
              Back to map
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 lg:p-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold text-slate-900">Book a charging slot</h1>
      <p className="text-sm text-slate-500 mt-1">Pick a time and confirm your reservation.</p>

      <div className="grid lg:grid-cols-[1fr_360px] gap-6 mt-6">
        <div className="space-y-4">
          {/* Charger summary */}
          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                  {charger.ocppId}
                </p>
                <h3 className="font-semibold text-slate-900 mt-0.5">
                  {charger.type} · {charger.connectorType} · {charger.powerKW}kW
                </h3>
                <div className="flex items-center gap-1 text-xs text-slate-500 mt-1">
                  <MapPin className="w-3 h-3" /> {station.name}
                </div>
              </div>
              <StatusBadge status={charger.status} />
            </div>
            {charger.status !== 'AVAILABLE' && (
              <p className="mt-3 flex items-center gap-1.5 text-xs text-amber-700 bg-amber-50 border border-amber-200 px-3 py-2 rounded-md">
                <AlertCircle className="w-3.5 h-3.5" />
                This charger is currently {charger.status.toLowerCase()}. You can still review details, but bookings need an available charger.
              </p>
            )}
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <h3 className="font-semibold text-slate-900 mb-3">Select start time</h3>
            <SlotPicker value={slot} onChange={setSlot} />
            {!slot && <p className="mt-3 text-[11px] text-slate-400">Pick any 30-minute slot to enable booking.</p>}
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <h3 className="font-semibold text-slate-900 mb-3">Duration</h3>
            <div className="flex gap-2 flex-wrap">
              {[30, 60, 90, 120].map((m) => (
                <button
                  key={m}
                  onClick={() => setDuration(m)}
                  className={`px-3 py-2 text-sm font-medium rounded-lg border transition ${
                    duration === m
                      ? 'bg-slate-900 text-white border-slate-900'
                      : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {m} min
                </button>
              ))}
            </div>
          </div>

          {submitError && (
            <div className="flex items-start gap-2 bg-rose-50 border border-rose-200 text-rose-700 px-3 py-2.5 rounded-lg text-xs">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{submitError}</span>
            </div>
          )}
        </div>

        {/* Summary sidebar */}
        <aside className="bg-white border border-slate-200 rounded-xl p-5 h-fit lg:sticky lg:top-6">
          <h3 className="font-semibold text-slate-900">Booking summary</h3>
          <dl className="mt-4 space-y-3 text-sm">
            <Row k="Station" v={station.name} />
            <Row k="Charger" v={`${charger.ocppId} · ${charger.powerKW}kW`} />
            <Row k="Connector" v={charger.connectorType} />
            <Row k="Start" v={slot ? slot.start.toLocaleString() : '—'} />
            <Row k="Duration" v={`${duration} min`} />
            <Row
              k="Est. energy"
              v={
                <span className="inline-flex items-center gap-1">
                  <Zap className="w-3.5 h-3.5 text-emerald-500" />
                  {estKWh.toFixed(1)} kWh
                </span>
              }
            />
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-sm font-medium text-slate-900">Total</span>
              <span className="text-lg font-bold text-slate-900 inline-flex items-center">
                <IndianRupee className="w-4 h-4" />
                {estCost.toFixed(0)}
              </span>
            </div>
          </dl>
          <Button
            onClick={handleConfirm}
            disabled={!canSubmit}
            loading={submitting}
            fullWidth
            size="lg"
            className="mt-5"
          >
            {submitting ? 'Confirming…' : slot ? 'Confirm booking' : 'Pick a slot to continue'}
          </Button>
          <p className="text-[11px] text-slate-400 text-center mt-3">
            Mock booking — no payment processed.
          </p>
        </aside>
      </div>
    </div>
  )
}

function Row({ k, v }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-slate-500">{k}</dt>
      <dd className="text-slate-900 font-medium text-right truncate max-w-[60%]">{v}</dd>
    </div>
  )
}

function BookingPageSkeleton() {
  return (
    <div className="p-4 lg:p-6 max-w-5xl mx-auto">
      <Skeleton className="h-7 w-56" />
      <Skeleton className="h-4 w-72 mt-2" />
      <div className="grid lg:grid-cols-[1fr_360px] gap-6 mt-6">
        <div className="space-y-4">
          <Skeleton className="h-24 rounded-xl" />
          <Skeleton className="h-48 rounded-xl" />
          <Skeleton className="h-24 rounded-xl" />
        </div>
        <Skeleton className="h-72 rounded-xl" />
      </div>
    </div>
  )
}
