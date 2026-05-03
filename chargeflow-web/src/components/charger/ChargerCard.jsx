import { memo } from 'react'
import { Zap, IndianRupee } from 'lucide-react'
import { Link } from 'react-router-dom'
import StatusBadge from '../common/StatusBadge.jsx'

function ChargerCard({ charger, stationId }) {
  const isAvailable = charger.status === 'AVAILABLE'
  return (
    <div className="p-4 bg-white rounded-xl border border-slate-200 hover:border-slate-300 hover:shadow-sm transition">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
            {charger.ocppId}
          </p>
          <h4 className="text-base font-semibold text-slate-900 mt-0.5">
            {charger.type} · {charger.connectorType}
          </h4>
        </div>
        <StatusBadge status={charger.status} />
      </div>

      <div className="grid grid-cols-2 gap-3 mt-4">
        <div className="rounded-lg bg-slate-50 p-3">
          <p className="text-[11px] text-slate-500 uppercase tracking-wide font-semibold">Power</p>
          <p className="text-lg font-bold text-slate-900 inline-flex items-center gap-1 mt-0.5">
            <Zap className="h-4 w-4 text-ev-gold" />
            {charger.powerKW}kW
          </p>
        </div>
        <div className="rounded-lg bg-slate-50 p-3">
          <p className="text-[11px] text-slate-500 uppercase tracking-wide font-semibold">Price</p>
          <p className="text-lg font-bold text-slate-900 inline-flex items-center mt-0.5">
            <IndianRupee className="w-4 h-4 text-slate-700" />
            {charger.pricePerKWh}
            <span className="text-xs text-slate-500 font-medium ml-1">/kWh</span>
          </p>
        </div>
      </div>

      <Link
        to={isAvailable ? `/booking/${charger.id}?station=${stationId}` : '#'}
        onClick={(e) => !isAvailable && e.preventDefault()}
        aria-disabled={!isAvailable}
        className={`mt-4 w-full grid place-items-center text-sm font-medium py-2.5 rounded-lg transition ${
          isAvailable
            ? 'bg-ev-gold text-ev-espresso shadow-sm shadow-black/25 transition hover:bg-ev-goldHover'
            : 'bg-slate-100 text-slate-400 cursor-not-allowed'
        }`}
      >
        {isAvailable ? 'Book this charger' : 'Unavailable'}
      </Link>
    </div>
  )
}

function arePropsEqual(prev, next) {
  if (prev.stationId !== next.stationId) return false
  const a = prev.charger
  const b = next.charger
  if (a === b) return true
  return (
    a?.id === b?.id &&
    a?.status === b?.status &&
    a?.powerKW === b?.powerKW &&
    a?.pricePerKWh === b?.pricePerKWh &&
    a?.ocppId === b?.ocppId &&
    a?.type === b?.type &&
    a?.connectorType === b?.connectorType
  )
}

export default memo(ChargerCard, arePropsEqual)
