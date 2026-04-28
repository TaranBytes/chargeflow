import { useMemo, useState } from 'react'

function generateSlots(date, count = 16) {
  const start = new Date(date)
  // Round up to next 30-minute boundary.
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

export default function SlotPicker({ value, onChange }) {
  const [day, setDay] = useState(0) // 0 = today, 1 = tomorrow, 2 = day after

  const slots = useMemo(() => {
    const base = new Date()
    base.setDate(base.getDate() + day)
    if (day > 0) base.setHours(8, 0, 0, 0)
    return generateSlots(base)
  }, [day])

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
        {slots.map((s) => {
          const selected = value?.key === s.key
          return (
            <button
              key={s.key}
              onClick={() => onChange?.(s)}
              className={`px-3 py-2 rounded-lg text-sm font-medium border transition ${
                selected
                  ? 'bg-emerald-500 text-white border-emerald-500 shadow-sm shadow-emerald-500/30'
                  : 'bg-white text-slate-700 border-slate-200 hover:border-emerald-400 hover:text-emerald-700'
              }`}
            >
              {s.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
