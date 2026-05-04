import { useEffect, useState } from 'react'
import { adminApi } from '../api/admin.api.js'
import { GlassCard, PageSection } from '../components/admin/AdminPanelPrimitives.jsx'

const severityClass = {
  low: 'bg-emerald-500/20 text-emerald-200 border-emerald-300/20',
  medium: 'bg-amber-500/20 text-amber-200 border-amber-300/20',
  high: 'bg-orange-500/20 text-orange-200 border-orange-300/20',
  critical: 'bg-rose-500/20 text-rose-200 border-rose-300/20',
}

export default function AdminAlertsPage() {
  const [alerts, setAlerts] = useState([])
  useEffect(() => {
    adminApi.listAlerts().then(setAlerts).catch(() => setAlerts([]))
  }, [])

  return (
    <PageSection title="Alerts" subtitle="Faulty chargers, offline stations, and critical events">
      <div className="space-y-3">
        {alerts.map((alert) => (
          <GlassCard key={alert.id} className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-white">{alert.message}</p>
              <p className="mt-1 text-xs uppercase tracking-wider text-white/50">{alert.type}</p>
              <p className="mt-1 text-xs text-white/40">
                {new Date(alert.createdAt).toLocaleString()}
              </p>
            </div>
            <span
              className={`rounded-full border px-2.5 py-1 text-xs capitalize ${severityClass[alert.severity] || severityClass.medium}`}
            >
              {alert.severity}
            </span>
          </GlassCard>
        ))}
        {alerts.length === 0 && <GlassCard className="text-sm text-white/60">No alerts found.</GlassCard>}
      </div>
    </PageSection>
  )
}
