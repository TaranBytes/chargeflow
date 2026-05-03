export const STATUS_LABELS = {
  AVAILABLE: 'Available',
  OCCUPIED: 'Occupied',
  RESERVED: 'Reserved',
  OFFLINE: 'Offline',
  FAULTED: 'Faulted',
}

export const STATUS_COLORS = {
  AVAILABLE: {
    bg: 'bg-ev-mint/12',
    text: 'text-ev-deep',
    dot: 'bg-ev-aqua',
    border: 'border-ev-aqua/30',
  },
  OCCUPIED: {
    bg: 'bg-rose-50',
    text: 'text-rose-700',
    dot: 'bg-rose-500',
    border: 'border-rose-200',
  },
  RESERVED: {
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    dot: 'bg-amber-500',
    border: 'border-amber-200',
  },
  OFFLINE: {
    bg: 'bg-slate-100',
    text: 'text-slate-600',
    dot: 'bg-slate-400',
    border: 'border-slate-200',
  },
  FAULTED: {
    bg: 'bg-orange-50',
    text: 'text-orange-700',
    dot: 'bg-orange-500',
    border: 'border-orange-200',
  },
}
