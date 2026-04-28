import { useEffect, useState } from 'react'
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

const TARGET_KWH = 28

export default function ActiveSessionPage() {
  const navigate = useNavigate()
  const toast = useToast()

  // For the demo we start with an active mock session.
  // Setting `active=false` simulates "no session right now" — empty state.
  const [active, setActive] = useState(true)
  const [elapsed, setElapsed] = useState(0)
  const [energy, setEnergy] = useState(0)
  const [running, setRunning] = useState(true)

  useEffect(() => {
    if (!active || !running) return
    const id = setInterval(() => {
      setElapsed((s) => s + 1)
      setEnergy((e) => Math.min(TARGET_KWH, e + 0.07))
    }, 1000)
    return () => clearInterval(id)
  }, [active, running])

  const handleStop = () => {
    setActive(false)
    setRunning(false)
    toast.info(
      'Session stopped',
      `Delivered ${energy.toFixed(1)} kWh · ₹${(energy * 18).toFixed(0)}`,
    )
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
          <h1 className="text-2xl font-bold text-slate-900">Charging Sessions</h1>
          <p className="text-sm text-slate-500 mt-1">Track active and past sessions.</p>
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
        <p className="text-xs font-semibold uppercase tracking-wider text-emerald-600 inline-flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse-soft" />
          {running ? 'Live session' : 'Paused'}
        </p>
        <h1 className="text-2xl font-bold text-slate-900 mt-1">
          Connaught Place SuperCharger · CP-001
        </h1>
        <p className="text-sm text-slate-500 mt-0.5">DC Fast · CCS · 150 kW</p>
      </div>

      {/* Hero progress */}
      <div className="bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-2xl p-6 text-white shadow-lg shadow-emerald-500/20 relative overflow-hidden">
        <div className="absolute -right-20 -top-20 w-56 h-56 rounded-full bg-white/10" />
        <div className="absolute -left-10 -bottom-10 w-40 h-40 rounded-full bg-white/5" />

        <div className="flex items-center justify-between relative">
          <div>
            <p className="text-xs uppercase tracking-wider text-emerald-100 font-semibold">
              Energy delivered
            </p>
            <p className="text-4xl font-bold mt-1">
              {energy.toFixed(1)}
              <span className="text-xl font-medium opacity-80 ml-1">kWh</span>
            </p>
          </div>
          <div className="w-14 h-14 rounded-full bg-white/15 backdrop-blur grid place-items-center">
            <BatteryCharging className="w-7 h-7" />
          </div>
        </div>

        <div className="mt-5 relative">
          <div className="flex items-center justify-between text-xs text-emerald-100">
            <span className="font-medium">Progress</span>
            <span>
              {progress.toFixed(0)}% of {TARGET_KWH} kWh target
            </span>
          </div>
          <div className="mt-2 h-2.5 bg-white/20 rounded-full overflow-hidden">
            <div
              className="h-full bg-white rounded-full transition-all duration-500"
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
      <div className="bg-white border border-slate-200 rounded-xl p-5">
        <h3 className="font-semibold text-slate-900 mb-3 text-sm">Live telemetry</h3>
        <div className="flex items-end gap-1 h-24">
          {Array.from({ length: 32 }).map((_, i) => {
            const h = 30 + Math.abs(Math.sin((elapsed + i) / 3)) * 60
            return (
              <div
                key={i}
                className="flex-1 bg-gradient-to-t from-emerald-500/60 to-emerald-400/30 rounded-t"
                style={{ height: `${h}%` }}
              />
            )
          })}
        </div>
        <p className="text-[11px] text-slate-400 mt-2">
          Mock telemetry — will be driven by{' '}
          <code className="bg-slate-100 px-1 rounded">session:tick</code> Socket.io events.
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
    <div className="bg-white border border-slate-200 rounded-xl p-4">
      <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wide">
        <Icon className="w-3.5 h-3.5" /> {label}
      </div>
      <p className="text-lg font-bold text-slate-900 mt-1">{value}</p>
    </div>
  )
}
