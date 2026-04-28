import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-react'

const STYLES = {
  success: {
    icon: CheckCircle2,
    accent: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    iconColor: 'text-emerald-600',
  },
  error: {
    icon: AlertTriangle,
    accent: 'bg-rose-50 text-rose-700 border-rose-200',
    iconColor: 'text-rose-600',
  },
  warning: {
    icon: AlertTriangle,
    accent: 'bg-amber-50 text-amber-700 border-amber-200',
    iconColor: 'text-amber-600',
  },
  info: {
    icon: Info,
    accent: 'bg-sky-50 text-sky-700 border-sky-200',
    iconColor: 'text-sky-600',
  },
}

export default function Toast({ id, type = 'info', title, message, onDismiss }) {
  const cfg = STYLES[type] || STYLES.info
  const Icon = cfg.icon
  return (
    <div
      role="status"
      className={`pointer-events-auto w-full max-w-sm rounded-xl border ${cfg.accent} shadow-lg shadow-slate-900/5 bg-white flex items-start gap-3 p-3.5`}
    >
      <Icon className={`w-5 h-5 shrink-0 mt-0.5 ${cfg.iconColor}`} />
      <div className="flex-1 min-w-0">
        {title && <p className="text-sm font-semibold text-slate-900">{title}</p>}
        {message && <p className="text-xs text-slate-600 mt-0.5">{message}</p>}
      </div>
      <button
        onClick={() => onDismiss?.(id)}
        className="p-1 rounded hover:bg-slate-100 text-slate-400"
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
