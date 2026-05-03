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
      className={`rounded-xl border border-dashed border-ev-gold/25 bg-black/25 p-8 text-center backdrop-blur-sm sm:p-10 ${className}`}
    >
      <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-ev-gold/12 text-ev-gold">
        <Icon className="h-6 w-6" />
      </div>
      <h3 className="mt-4 text-sm font-semibold text-white">{title}</h3>
      {description && <p className="mx-auto mt-1 max-w-sm text-xs text-white/70">{description}</p>}
      {action && <div className="mt-5 flex justify-center">{action}</div>}
    </div>
  )
}
