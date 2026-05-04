import { motion } from 'framer-motion'

export function PageSection({ title, subtitle, actions, children }) {
  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">{title}</h1>
          {subtitle ? <p className="text-sm text-white/60">{subtitle}</p> : null}
        </div>
        {actions}
      </div>
      {children}
    </section>
  )
}

export function GlassCard({ className = '', children }) {
  return (
    <div
      className={`rounded-2xl border border-white/10 bg-[rgba(255,255,255,0.04)] p-4 shadow-lg shadow-black/20 backdrop-blur-xl ${className}`}
    >
      {children}
    </div>
  )
}

export function StatTile({ label, value, accent = 'text-[#FFDE42]' }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-white/10 bg-[#221414]/75 p-4"
    >
      <p className="text-xs uppercase tracking-wider text-white/55">{label}</p>
      <p className={`mt-2 text-2xl font-bold ${accent}`}>{value}</p>
    </motion.div>
  )
}

export function MiniBarChart({ rows, valueKey, labelKey }) {
  const max = Math.max(...rows.map((r) => Number(r[valueKey] || 0)), 1)
  return (
    <div className="space-y-2">
      {rows.map((row) => {
        const value = Number(row[valueKey] || 0)
        return (
          <div key={row[labelKey]} className="space-y-1">
            <div className="flex items-center justify-between text-xs text-white/70">
              <span>{row[labelKey]}</span>
              <span>{value.toFixed(2)}</span>
            </div>
            <div className="h-2 rounded-full bg-white/10">
              <div
                className="h-2 rounded-full bg-[#FFDE42] transition-all"
                style={{ width: `${(value / max) * 100}%` }}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}
