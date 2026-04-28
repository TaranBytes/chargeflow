import { Calendar, MapPin, Zap } from 'lucide-react'
import StatusBadge from '../common/StatusBadge.jsx'
import { formatDateTime, formatCurrency } from '../../utils/formatters.js'

// Map booking lifecycle status onto the charger status badge palette
const STATUS_TO_BADGE = {
  CONFIRMED: 'RESERVED',
  PENDING: 'RESERVED',
  IN_PROGRESS: 'OCCUPIED',
  COMPLETED: 'AVAILABLE',
  CANCELLED: 'OFFLINE',
  EXPIRED: 'OFFLINE',
}

export default function BookingCard({ booking, onCancel }) {
  return (
    <div className="p-5 bg-white rounded-xl border border-slate-200 hover:border-slate-300 transition">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-semibold text-slate-900 truncate">{booking.stationName}</h3>
          <div className="flex items-center gap-1 text-xs text-slate-500 mt-1">
            <MapPin className="w-3 h-3 shrink-0" /> {booking.chargerName}
          </div>
        </div>
        <StatusBadge status={STATUS_TO_BADGE[booking.status] || 'OFFLINE'} />
      </div>

      <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-slate-100">
        <div>
          <p className="text-[11px] uppercase font-semibold text-slate-500 tracking-wide">When</p>
          <p className="text-sm font-medium text-slate-900 mt-0.5 flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            {formatDateTime(booking.startTime)}
          </p>
        </div>
        <div>
          <p className="text-[11px] uppercase font-semibold text-slate-500 tracking-wide">Energy</p>
          <p className="text-sm font-medium text-slate-900 mt-0.5 flex items-center gap-1">
            <Zap className="w-3.5 h-3.5 text-emerald-500" />
            {booking.estimatedKWh} kWh
          </p>
        </div>
        <div>
          <p className="text-[11px] uppercase font-semibold text-slate-500 tracking-wide">Cost</p>
          <p className="text-sm font-medium text-slate-900 mt-0.5">
            {formatCurrency(booking.estimatedCost)}
          </p>
        </div>
      </div>

      {['CONFIRMED', 'PENDING'].includes(booking.status) && onCancel && (
        <div className="mt-4 flex justify-end">
          <button
            onClick={() => onCancel(booking)}
            className="text-xs font-medium text-rose-600 hover:bg-rose-50 px-3 py-1.5 rounded-md"
          >
            Cancel booking
          </button>
        </div>
      )}
    </div>
  )
}
