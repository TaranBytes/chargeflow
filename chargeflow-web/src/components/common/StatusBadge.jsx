import { STATUS_COLORS, STATUS_LABELS } from '../../utils/constants.js'

const SIZES = {
  sm: 'text-xs px-2 py-0.5',
  md: 'text-xs px-2.5 py-1',
  lg: 'text-sm px-3 py-1',
}

export default function StatusBadge({ status, size = 'sm', dotOnly = false, className = '' }) {
  const c = STATUS_COLORS[status] || STATUS_COLORS.OFFLINE

  if (dotOnly) {
    return (
      <span
        title={STATUS_LABELS[status] || status}
        className={`inline-block h-2 w-2 rounded-full ${c.dot} ${className}`}
      />
    )
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border font-medium whitespace-nowrap ${c.bg} ${c.text} ${c.border} ${SIZES[size]} ${className}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${c.dot}`} />
      {STATUS_LABELS[status] || status}
    </span>
  )
}
