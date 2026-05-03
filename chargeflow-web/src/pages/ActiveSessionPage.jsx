import { useCallback, useEffect, useState } from 'react'
import {
  Zap,
  BatteryCharging,
  IndianRupee,
  Pause,
  Play,
  Square,
  Clock,
  Battery,
  Activity,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import EmptyState from '../components/common/EmptyState.jsx'
import Button from '../components/common/Button.jsx'
import { useToast } from '../hooks/useToast.js'
import { bookingApi } from '../api/booking.api.js'
import { useSocket } from '../hooks/useSocket.js'
import { notificationService } from '../services/notification.service.js'

const TARGET_KWH = 28
const ACTIVE_OR_UPCOMING = ['CONFIRMED', 'PENDING', 'IN_PROGRESS']
const FALLBACK_SESSION = {
  stationName: 'Connaught Place SuperCharger',
  chargerCode: 'CP-001',
  chargerDetails: 'DC Fast · CCS · 150 kW',
}

export default function ActiveSessionPage() {
  const navigate = useNavigate()
  const toast = useToast()
  const { subscribe } = useSocket() || {}

  // For the demo we start with an active mock session.
  // Setting `active=false` simulates "no session right now" — empty state.
  const [active, setActive] = useState(true)
  const [elapsed, setElapsed] = useState(0)
  const [energy, setEnergy] = useState(0)
  const [running, setRunning] = useState(true)
  const [sessionBooking, setSessionBooking] = useState(FALLBACK_SESSION)

  useEffect(() => {
    if (!active || !running) return
    const id = setInterval(() => {
      setElapsed((s) => s + 1)
      setEnergy((e) => Math.min(TARGET_KWH, e + 0.07))
    }, 1000)
    return () => clearInterval(id)
  }, [active, running])

  const loadNextBooking = useCallback(async () => {
    try {
      const bookings = await bookingApi.list()
      const now = Date.now()
      const nextBooking = (bookings || [])
        .filter((booking) => {
          if (!ACTIVE_OR_UPCOMING.includes(booking.status)) return false
          const endAt = new Date(booking.endTime || booking.startTime || 0).getTime()
          return Number.isFinite(endAt) && endAt > now
        })
        .sort((a, b) => new Date(a.startTime || 0).getTime() - new Date(b.startTime || 0).getTime())[0]

      if (!nextBooking) {
        setSessionBooking(FALLBACK_SESSION)
        return
      }

      const stationName = nextBooking.stationName || FALLBACK_SESSION.stationName
      const chargerName = nextBooking.chargerName || ''
      const parts = chargerName
        .split('·')
        .map((part) => part.trim())
        .filter(Boolean)
      const chargerCode = parts[0] || FALLBACK_SESSION.chargerCode
      const chargerDetails = parts.length > 1 ? parts.slice(1).join(' · ') : FALLBACK_SESSION.chargerDetails

      setSessionBooking({ stationName, chargerCode, chargerDetails })
    } catch {
      // Keep demo fallback if bookings API is unavailable.
      setSessionBooking(FALLBACK_SESSION)
    }
  }, [])

  useEffect(() => {
    loadNextBooking()
  }, [loadNextBooking])

  useEffect(() => {
    if (!subscribe) return
    const offCreated = subscribe('bookingCreated', () => {
      loadNextBooking()
    })
    const offUpdated = subscribe('bookingUpdate', () => {
      loadNextBooking()
    })
    const offStarted = subscribe('chargingStarted', () => {
      loadNextBooking()
    })
    const offStopped = subscribe('chargingStopped', () => {
      loadNextBooking()
    })
    return () => {
      offCreated?.()
      offUpdated?.()
      offStarted?.()
      offStopped?.()
    }
  }, [subscribe, loadNextBooking])

  const handleStop = () => {
    const amount = Number((energy * 18).toFixed(0))
    setActive(false)
    setRunning(false)
    toast.info(
      'Session stopped',
      `Delivered ${energy.toFixed(1)} kWh · ₹${amount}`,
    )
    notificationService.add({
      type: 'session',
      title: 'Session ended',
      body: `${sessionBooking.stationName} · ${sessionBooking.chargerCode} delivered ${energy.toFixed(1)} kWh · ₹${amount}.`,
      dedupeKey: `session-stop:demo:${sessionBooking.chargerCode}:${Math.floor(elapsed / 5)}`,
    })
  }

  const handleStart = () => {
    setElapsed(0)
    setEnergy(0)
    setRunning(true)
    setActive(true)
  }

  if (!active) {
    return (
      <div className="p-4 lg:p-6 max-w-2xl mx-auto space-y-5">
        <div>
          <h1 className="text-2xl font-bold text-white">Charging Sessions</h1>
          <p className="text-sm text-white/70 mt-1">Track active and past sessions.</p>
        </div>
        <EmptyState
          icon={Activity}
          title="No active session"
          description="When you start charging at a station, you'll see live energy, power, and cost here."
          action={
            <div className="flex gap-2">
              <Button onClick={() => navigate('/')}>Find a charger</Button>
              <Button variant="outline" onClick={handleStart}>
                Resume mock session
              </Button>
            </div>
          }
        />
      </div>
    )
  }

  const progress = Math.min(100, (energy / TARGET_KWH) * 100)
  const cost = energy * 18
  const power = running ? 48 + Math.sin(elapsed / 4) * 4 : 0
  const mins = Math.floor(elapsed / 60)
  const secs = String(elapsed % 60).padStart(2, '0')
  const soc = Math.min(100, 40 + progress * 0.5)

  return (
    <div className="p-4 lg:p-6 max-w-3xl mx-auto space-y-6">
      <div>
        <p className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-ev-gold">
          <span className="h-2 w-2 animate-pulse-soft rounded-full bg-ev-gold shadow-[0_0_12px_rgba(255,222,66,0.55)]" />
          {running ? 'Live session' : 'Paused'}
        </p>
        <h1 className="text-2xl font-bold text-white mt-1">
          {sessionBooking.stationName} · {sessionBooking.chargerCode}
        </h1>
        <p className="text-sm text-white/70 mt-0.5">{sessionBooking.chargerDetails}</p>
      </div>

      {/* Hero progress */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#FFDE42] to-[#C8A900] p-6 text-[#1B0C0C] shadow-lg shadow-black/30">
        <div className="absolute -right-20 -top-20 w-56 h-56 rounded-full bg-black/8" />
        <div className="absolute -left-10 -bottom-10 w-40 h-40 rounded-full bg-black/5" />

        <div className="relative flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[#1B0C0C]/80">
              Energy delivered
            </p>
            <p className="mt-1 text-4xl font-bold">
              {energy.toFixed(1)}
              <span className="ml-1 text-xl font-medium opacity-80">kWh</span>
            </p>
          </div>
          <div className="grid h-14 w-14 place-items-center rounded-full bg-black/12 backdrop-blur">
            <BatteryCharging className="h-7 w-7" />
          </div>
        </div>

        <div className="relative mt-5">
          <div className="flex items-center justify-between text-xs text-[#1B0C0C]/85">
            <span className="font-medium">Progress</span>
            <span>
              {progress.toFixed(0)}% of {TARGET_KWH} kWh target
            </span>
          </div>
          <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-black/15">
            <div
              className="h-full rounded-full bg-[#1B0C0C] transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Tile icon={Clock} label="Elapsed" value={`${mins}:${secs}`} />
        <Tile icon={Zap} label="Power" value={`${power.toFixed(1)} kW`} />
        <Tile icon={IndianRupee} label="Cost so far" value={`₹${cost.toFixed(0)}`} />
        <Tile icon={Battery} label="State of Charge" value={`${soc.toFixed(0)}%`} />
      </div>

      {/* Live ticks placeholder */}
      <div className="rounded-xl border border-white/10 bg-[rgba(255,255,255,0.04)] p-5 backdrop-blur-sm">
        <h3 className="mb-3 text-sm font-semibold text-white">Live telemetry</h3>
        <div className="flex h-24 items-end gap-1">
          {Array.from({ length: 32 }).map((_, i) => {
            const h = 30 + Math.abs(Math.sin((elapsed + i) / 3)) * 60
            return (
              <div
                key={i}
                className="flex-1 rounded-t bg-gradient-to-t from-ev-moss/90 to-ev-gold/35"
                style={{ height: `${h}%` }}
              />
            )
          })}
        </div>
        <p className="mt-2 text-[11px] text-white/50">
          Mock telemetry — will be driven by{' '}
          <code className="rounded bg-black/30 px-1 text-ev-gold/90">session:tick</code> Socket.io events.
        </p>
      </div>

      {/* Controls */}
      <div className="flex gap-3">
        <Button
          variant="outline"
          fullWidth
          size="lg"
          leftIcon={running ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          onClick={() => setRunning((r) => !r)}
        >
          {running ? 'Pause (mock)' : 'Resume'}
        </Button>
        <Button
          variant="danger"
          fullWidth
          size="lg"
          leftIcon={<Square className="w-4 h-4" />}
          onClick={handleStop}
        >
          Stop charging
        </Button>
      </div>
    </div>
  )
}

function Tile({ icon: Icon, label, value }) {
  return (
    <div className="rounded-xl border border-white/10 bg-[rgba(255,255,255,0.04)] p-4 backdrop-blur-sm">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-white/55">
        <Icon className="h-3.5 w-3.5 text-ev-gold" /> {label}
      </div>
      <p className="mt-1 text-lg font-bold text-white">{value}</p>
    </div>
  )
}
