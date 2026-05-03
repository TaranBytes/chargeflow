import { Inbox } from 'lucide-react'

export default function EmptyState({
  icon: Icon = Inbox,
  title = 'Nothing here yet',
  description,
  action,
  className = '',
}) {
  return (
    <div
      className={`bg-slate-900/70 border border-dashed border-slate-700 rounded-xl p-8 sm:p-10 text-center ${className}`}
    >
      <div className="w-12 h-12 mx-auto rounded-full bg-slate-800 grid place-items-center text-slate-400">
        <Icon className="w-6 h-6" />
      </div>
      <h3 className="mt-4 text-sm font-semibold text-slate-100">{title}</h3>
      {description && (
        <p className="mt-1 text-xs text-slate-400 max-w-sm mx-auto">{description}</p>
      )}
      {action && <div className="mt-5 flex justify-center">{action}</div>}
    </div>
  )
}
