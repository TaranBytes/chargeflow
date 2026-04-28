import { useEffect, useState, useMemo, useCallback } from 'react'
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
import { useSocket } from '../hooks/useSocket.js'
import {
  Zap,
  IndianRupee,
  MapPin,
  CalendarCheck,
  Clock,
  AlertCircle,
  MapPinOff,
  Hourglass,
  Sparkles,
} from 'lucide-react'

// Mock-but-realistic average session length used for "estimated wait" copy.
const AVG_SESSION_MIN = 35

function validate({ slot, charger, duration, conflicts }) {
  const errors = {}
  if (!charger) errors.charger = 'Pick a charger first.'
  else if (charger.status !== 'AVAILABLE')
    errors.charger = `This charger is currently ${charger.status.toLowerCase()}.`
  if (!slot) errors.slot = 'Choose a start time.'
  if (!duration || duration <= 0) errors.duration = 'Select a duration.'
  if (slot && conflicts) errors.slot = 'That slot conflicts with another booking.'
  return errors
}

function slotConflictsWith(slotStart, durationMin, ranges) {
  if (!slotStart) return false
  const end = new Date(slotStart.getTime() + durationMin * 60 * 1000)
  return ranges.some(
    (r) => new Date(r.startTime) < end && new Date(r.endTime) > slotStart,
  )
}

export default function BookingPage() {
  const { chargerId } = useParams()
  const [searchParams] = useSearchParams()
  const stationId = searchParams.get('station')
  const navigate = useNavigate()
  const toast = useToast()
  const { subscribe } = useSocket() || {}

  const [station, setStation] = useState(null)
  const [charger, setCharger] = useState(null)
  const [existingBookings, setExistingBookings] = useState([])
  const [loadError, setLoadError] = useState(null)
  const [loading, setLoading] = useState(Boolean(stationId))

  const [slot, setSlot] = useState(null)
  const [duration, setDuration] = useState(30)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState(null)
  const [confirmed, setConfirmed] = useState(null)

  const fetchAll = useCallback(async () => {
    if (!stationId) return
    setLoading(true)
    setLoadError(null)
    try {
      const s = await stationApi.getById(stationId)
      setStation(s)
      const c =
        s.chargers.find((x) => x.id === chargerId) ||
        s.chargers.find((x) => x.status === 'AVAILABLE') ||
        s.chargers[0]
      setCharger(c)
      if (c?.id) {
        const ex = await bookingApi.forCharger(c.id)
        setExistingBookings(ex)
      }
    } catch (err) {
      setLoadError(err)
    } finally {
      setLoading(false)
    }
  }, [stationId, chargerId])

  useEffect(() => {
    fetchAll()
  }, [fetchAll])

  // Real-time charger status sync — if the charger we're booking goes
  // OCCUPIED/RESERVED/OFFLINE while the user is on this page, reflect that.
  useEffect(() => {
    if (!subscribe || !charger?.id) return
    const off = subscribe('chargerStatusUpdate', (evt) => {
      const cid = String(evt.chargerId ?? '')
      const ocppId = evt.ocppId
      if (cid !== String(charger.id) && ocppId !== charger.ocppId) return
      setCharger((prev) => (prev ? { ...prev, status: evt.status } : prev))
      if (evt.status === 'OCCUPIED' || evt.status === 'OFFLINE') {
        toast.warning(
          'Charger just changed',
          `${evt.ocppId ?? 'This charger'} is now ${String(evt.status).toLowerCase()}.`,
        )
      }
    })
    return off
  }, [subscribe, charger?.id, charger?.ocppId, toast])

  // Refresh existing bookings when a booking is created elsewhere for this charger.
  useEffect(() => {
    if (!subscribe || !charger?.id) return
    const off = subscribe('bookingCreated', ({ booking } = {}) => {
      if (!booking) return
      const cid = booking.chargerId || booking.charger?.id || booking.charger
      if (String(cid) === String(charger.id)) {
        bookingApi.forCharger(charger.id).then(setExistingBookings).catch(() => {})
      }
    })
    return off
  }, [subscribe, charger?.id])

  const estKWh = useMemo(
    () => (charger ? ((charger.powerKW * duration) / 60) * 0.85 : 0),
    [charger, duration],
  )
  const estCost = useMemo(
    () => (charger ? estKWh * charger.pricePerKWh : 0),
    [charger, estKWh],
  )

  const conflicts = useMemo(
    () => slotConflictsWith(slot?.start, duration, existingBookings),
    [slot, duration, existingBookings],
  )

  const errors = validate({ slot, charger, duration, conflicts })
  const canSubmit = Object.keys(errors).length === 0

  // "Next available" computed against current duration.
  const nextAvailable = useMemo(() => {
    const start = new Date()
    start.setMinutes(Math.ceil(start.getMinutes() / 30) * 30, 0, 0)
    for (let i = 0; i < 96; i++) {
      const t = new Date(start.getTime() + i * 30 * 60 * 1000)
      if (!slotConflictsWith(t, duration, existingBookings)) return t
    }
    return null
  }, [duration, existingBookings])

  const showWaitNotice =
    charger?.status === 'OCCUPIED' || charger?.status === 'RESERVED'

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
      const msg =
        err?.code === 'BOOKING_CONFLICT'
          ? 'That slot was just taken. Try another time.'
          : err?.message || 'Could not create booking. Please try again.'
      setSubmitError(msg)
      toast.error('Booking failed', msg)
      // Refresh known bookings — backend or another tab may know more than us.
      if (charger?.id) bookingApi.forCharger(charger.id).then(setExistingBookings).catch(() => {})
    } finally {
      setSubmitting(false)
    }
  }

  if (!stationId) {
    return (
      <div className="p-6 max-w-md mx-auto mt-12">
        <EmptyState
          icon={MapPinOff}
          title="Pick a charger first"
          description="Choose a station and an available charger from the map to start a booking."
          action={<Button onClick={() => navigate('/')}>Open map</Button>}
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
          onRetry={fetchAll}
        />
        <div className="mt-3 text-center">
          <Link to="/" className="text-xs text-slate-500 hover:text-slate-900">
            ← Back to map
          </Link>
        </div>
      </div>
    )
  }

  if (loading) return <BookingPageSkeleton />

  if (!station || !charger) {
    return (
      <div className="p-6 max-w-md mx-auto mt-12">
        <EmptyState
          icon={MapPinOff}
          title="Charger not found"
          description="The charger you're trying to book may have been removed."
          action={
            <Button variant="outline" onClick={() => navigate('/')}>
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

  const chargerLocked = charger.status !== 'AVAILABLE'

  return (
    <div className="p-4 lg:p-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold text-slate-900">Book a charging slot</h1>
      <p className="text-sm text-slate-500 mt-1">
        Real-time availability — slots already taken are disabled.
      </p>

      <div className="grid lg:grid-cols-[1fr_360px] gap-6 mt-6">
        <div className="space-y-4">
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

            {showWaitNotice && (
              <p className="mt-3 flex items-center gap-1.5 text-xs text-amber-700 bg-amber-50 border border-amber-200 px-3 py-2 rounded-md">
                <Hourglass className="w-3.5 h-3.5" />
                Charger is currently {charger.status.toLowerCase()}. Average session ≈ {AVG_SESSION_MIN} min.
                {nextAvailable && (
                  <span className="ml-1">
                    Next free slot:{' '}
                    <strong>
                      {nextAvailable.toLocaleString([], {
                        weekday: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </strong>
                  </span>
                )}
              </p>
            )}

            {!showWaitNotice && nextAvailable && (
              <p className="mt-3 flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-2 rounded-md">
                <Sparkles className="w-3.5 h-3.5" />
                Earliest open slot:{' '}
                <strong>
                  {nextAvailable.toLocaleString([], {
                    weekday: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </strong>
                <button
                  type="button"
                  onClick={() =>
                    setSlot({
                      key: nextAvailable.toISOString(),
                      start: nextAvailable,
                      end: new Date(nextAvailable.getTime() + 30 * 60 * 1000),
                      label: nextAvailable.toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      }),
                    })
                  }
                  className="ml-auto text-emerald-700 font-semibold hover:underline"
                >
                  Use it →
                </button>
              </p>
            )}
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-slate-900">Select start time</h3>
              <span className="text-[11px] text-slate-400">
                {existingBookings.length} existing booking
                {existingBookings.length === 1 ? '' : 's'} on this charger
              </span>
            </div>
            <SlotPicker
              value={slot}
              onChange={setSlot}
              duration={duration}
              disabledRanges={existingBookings}
              locked={chargerLocked}
            />
            {errors.slot && (
              <p className="mt-2 text-[11px] text-rose-600 inline-flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> {errors.slot}
              </p>
            )}
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
            {submitting
              ? 'Confirming…'
              : !slot
              ? 'Pick a slot to continue'
              : conflicts
              ? 'That slot is taken'
              : chargerLocked
              ? 'Charger unavailable'
              : 'Confirm booking'}
          </Button>
          <p className="text-[11px] text-slate-400 text-center mt-3">
            Slots update live as other users book.
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
          <Skeleton className="h-28 rounded-xl" />
          <Skeleton className="h-56 rounded-xl" />
          <Skeleton className="h-24 rounded-xl" />
        </div>
        <Skeleton className="h-72 rounded-xl" />
      </div>
    </div>
  )
}
