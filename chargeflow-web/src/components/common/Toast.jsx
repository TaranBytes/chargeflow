import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-react'

const STYLES = {
  success: {
    icon: CheckCircle2,
    accent: 'bg-slate-900 text-emerald-300 border-emerald-900/60',
    iconColor: 'text-emerald-400',
  },
  error: {
    icon: AlertTriangle,
    accent: 'bg-slate-900 text-rose-300 border-rose-900/60',
    iconColor: 'text-rose-400',
  },
  warning: {
    icon: AlertTriangle,
    accent: 'bg-slate-900 text-amber-300 border-amber-900/60',
    iconColor: 'text-amber-400',
  },
  info: {
    icon: Info,
    accent: 'bg-slate-900 text-sky-300 border-sky-900/60',
    iconColor: 'text-sky-400',
  },
}

export default function Toast({ id, type = 'info', title, message, onDismiss }) {
  const cfg = STYLES[type] || STYLES.info
  const Icon = cfg.icon
  return (
    <div
      role="status"
      className={`pointer-events-auto w-full max-w-sm rounded-xl border ${cfg.accent} shadow-lg shadow-black/35 flex items-start gap-3 p-3.5 backdrop-blur`}
    >
      <Icon className={`w-5 h-5 shrink-0 mt-0.5 ${cfg.iconColor}`} />
      <div className="flex-1 min-w-0">
        {title && <p className="text-sm font-semibold text-slate-100">{title}</p>}
        {message && <p className="text-xs text-slate-400 mt-0.5">{message}</p>}
      </div>
      <button
        onClick={() => onDismiss?.(id)}
        className="p-1 rounded hover:bg-slate-800 text-slate-500"
        aria-label="Dismiss notification"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}

export function ToastViewport({ toasts, onDismiss }) {
  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
      {toasts.map((t) => (
        <Toast key={t.id} {...t} onDismiss={onDismiss} />
      ))}
    </div>
  )
}
