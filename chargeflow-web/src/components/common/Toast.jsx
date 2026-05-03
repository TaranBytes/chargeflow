import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-react'

const STYLES = {
  success: {
    icon: CheckCircle2,
    accent: 'bg-ev-sidebar/95 text-white border-ev-gold/35',
    iconColor: 'text-ev-gold',
  },
  error: {
    icon: AlertTriangle,
    accent: 'bg-ev-sidebar/95 text-rose-300 border-rose-500/35',
    iconColor: 'text-rose-400',
  },
  warning: {
    icon: AlertTriangle,
    accent: 'bg-ev-sidebar/95 text-amber-200 border-amber-500/35',
    iconColor: 'text-amber-400',
  },
  info: {
    icon: Info,
    accent: 'bg-ev-sidebar/95 text-white border-ev-gold/25',
    iconColor: 'text-ev-gold',
  },
}

export default function Toast({ id, type = 'info', title, message, onDismiss }) {
  const cfg = STYLES[type] || STYLES.info
  const Icon = cfg.icon
  return (
    <div
      role="status"
      className={`pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-xl border p-3.5 shadow-lg shadow-black/35 backdrop-blur-md ${cfg.accent}`}
    >
      <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${cfg.iconColor}`} />
      <div className="min-w-0 flex-1">
        {title && <p className="text-sm font-semibold text-white">{title}</p>}
        {message && <p className="mt-0.5 text-xs text-white/70">{message}</p>}
      </div>
      <button
        onClick={() => onDismiss?.(id)}
        className="rounded p-1 text-white/50 transition hover:bg-white/10 hover:text-white"
        aria-label="Dismiss notification"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}

export function ToastViewport({ toasts, onDismiss }) {
  return (
    <div className="pointer-events-none fixed right-4 top-4 z-50 flex flex-col gap-2">
      {toasts.map((t) => (
        <Toast key={t.id} {...t} onDismiss={onDismiss} />
      ))}
    </div>
  )
}
