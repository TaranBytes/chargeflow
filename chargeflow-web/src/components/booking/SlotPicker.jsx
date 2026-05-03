import { useMemo, useState, memo } from 'react'
import { Sparkles } from 'lucide-react'

function generateSlots(date, count = 16) {
  const start = new Date(date)
  const minutes = start.getMinutes()
  start.setMinutes(Math.ceil(minutes / 30) * 30, 0, 0)
  const slots = []
  for (let i = 0; i < count; i++) {
    const t = new Date(start.getTime() + i * 30 * 60 * 1000)
    const end = new Date(t.getTime() + 30 * 60 * 1000)
    slots.push({
      key: t.toISOString(),
      start: t,
      end,
      label: t.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    })
  }
  return slots
}

function overlapsAny(slotStart, slotEnd, ranges) {
  for (const r of ranges) {
    const a = r.startTime instanceof Date ? r.startTime : new Date(r.startTime)
    const b = r.endTime instanceof Date ? r.endTime : new Date(r.endTime)
    if (a < slotEnd && b > slotStart) return true
  }
  return false
}

function SlotPicker({
  value,
  onChange,
  duration = 30,
  disabledRanges = [],
  // If the underlying charger isn't bookable at all, lock the whole picker.
  locked = false,
}) {
  const [day, setDay] = useState(0)

  const enrichedSlots = useMemo(() => {
    const base = new Date()
    base.setDate(base.getDate() + day)
    if (day > 0) base.setHours(8, 0, 0, 0)
    const raw = generateSlots(base)
    return raw.map((s) => {
      const slotEnd = new Date(s.start.getTime() + duration * 60 * 1000)
      const past = s.start.getTime() <= Date.now()
      const conflicts = !past && overlapsAny(s.start, slotEnd, disabledRanges)
      return { ...s, disabled: locked || past || conflicts, conflicts, past }
    })
  }, [day, duration, disabledRanges, locked])

  const nextAvailableKey = useMemo(
    () => enrichedSlots.find((s) => !s.disabled)?.key,
    [enrichedSlots],
  )

  return (
    <div>
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        {[0, 1, 2].map((d) => {
          const date = new Date()
          date.setDate(date.getDate() + d)
          const label =
            d === 0
              ? 'Today'
              : d === 1
              ? 'Tomorrow'
              : date.toLocaleDateString([], { weekday: 'short', day: 'numeric' })
          return (
            <button
              key={d}
              onClick={() => setDay(d)}
              className={`px-3 py-1.5 text-sm rounded-lg font-medium transition ${
                day === d
                  ? 'bg-slate-900 text-white'
                  : 'bg-white border border-slate-200 text-slate-700 hover:border-slate-300'
              }`}
            >
              {label}
            </button>
          )
        })}
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
        {enrichedSlots.map((s) => {
          const selected = value?.key === s.key
          const isNext = s.key === nextAvailableKey && !selected
          let cls = 'bg-white text-slate-700 border-slate-200 hover:border-ev-aqua hover:text-ev-deep'
          if (selected)
            cls = 'bg-ev-aqua text-white border-ev-aqua shadow-sm shadow-glow-aqua'
          else if (s.disabled)
            cls = 'bg-slate-50 text-slate-300 border-slate-200 cursor-not-allowed line-through'
          else if (isNext) cls = 'bg-ev-mint/15 text-ev-deep border-ev-aqua/40'

          return (
            <button
              key={s.key}
              onClick={() => !s.disabled && onChange?.(s)}
              disabled={s.disabled}
              title={
                s.past
                  ? 'In the past'
                  : s.conflicts
                  ? 'Already booked'
                  : isNext
                  ? 'Next available slot'
                  : ''
              }
              className={`relative px-3 py-2 rounded-lg text-sm font-medium border transition ${cls}`}
            >
              {s.label}
              {isNext && (
                <span className="absolute -right-1.5 -top-1.5 inline-flex items-center gap-0.5 rounded-full bg-ev-aqua px-1.5 py-0.5 text-[9px] font-bold text-white">
                  <Sparkles className="w-2.5 h-2.5" />
                  Next
                </span>
              )}
            </button>
          )
        })}
      </div>

      <div className="mt-3 flex items-center gap-3 text-[11px] text-slate-500">
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded bg-ev-aqua" /> Selected
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded border border-ev-aqua/40 bg-ev-mint/10" /> Available
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block w-2.5 h-2.5 rounded bg-slate-200" /> Booked / past
        </span>
      </div>
    </div>
  )
}

export default memo(SlotPicker)
