import { useEffect, useMemo, useState } from 'react'
import { adminApi } from '../api/admin.api.js'
import { GlassCard, PageSection } from '../components/admin/AdminPanelPrimitives.jsx'

export default function AdminChargersPage() {
  const [chargers, setChargers] = useState([])

  const load = async () => setChargers((await adminApi.listChargers()) || [])
  useEffect(() => {
    load()
  }, [])

  const grouped = useMemo(() => {
    return chargers.reduce((acc, charger) => {
      const key = charger.station?.name || 'Unassigned'
      acc[key] = acc[key] || []
      acc[key].push(charger)
      return acc
    }, {})
  }, [chargers])

  return (
    <PageSection title="Chargers" subtitle="Grouped by station with real-time status controls">
      <div className="space-y-4">
        {Object.entries(grouped).map(([station, list]) => (
          <GlassCard key={station}>
            <h2 className="mb-3 text-sm font-semibold text-white">{station}</h2>
            <div className="space-y-2">
              {list.map((charger) => (
                <div
                  key={charger.id}
                  className="flex flex-wrap items-center gap-2 rounded-xl border border-white/10 bg-black/20 p-3"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-white">{charger.ocppId}</p>
                    <p className="text-xs text-white/60">
                      {charger.type} • {charger.powerKW} kW
                    </p>
                  </div>
                  <span className="rounded-full bg-[#4C5C2D]/70 px-2 py-1 text-xs capitalize text-white">
                    {charger.status}
                  </span>
                  <button
                    onClick={async () => {
                      await adminApi.toggleCharger(charger.id)
                      await load()
                    }}
                    className="rounded-md border border-white/20 px-2 py-1 text-xs text-white/80"
                  >
                    {charger.isEnabled ? 'Disable' : 'Enable'}
                  </button>
                  <button
                    onClick={async () => {
                      const power = window.prompt('Set power in kW', charger.powerKW)
                      if (!power) return
                      await adminApi.updateCharger(charger.id, { power: Number(power) })
                      await load()
                    }}
                    className="rounded-md border border-[#FFDE42]/40 px-2 py-1 text-xs text-[#FFDE42]"
                  >
                    Edit power
                  </button>
                </div>
              ))}
            </div>
          </GlassCard>
        ))}
      </div>
    </PageSection>
  )
}
