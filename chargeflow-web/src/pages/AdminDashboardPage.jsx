import { useEffect, useState } from 'react'
import { adminApi } from '../api/admin.api.js'
import { GlassCard, MiniBarChart, PageSection, StatTile } from '../components/admin/AdminPanelPrimitives.jsx'

export default function AdminDashboardPage() {
  const [data, setData] = useState(null)

  useEffect(() => {
    adminApi.dashboard().then(setData).catch(() => setData({}))
  }, [])

  const stations = data?.stations || []
  const chargers = data?.chargers || []
  const activeSessions = data?.activeSessions || []
  const revenueSummary = data?.revenueSummary || {}
  const revenueSeries = data?.revenueTimeseries || []
  const alerts = data?.alerts || []

  return (
    <PageSection title="Admin Dashboard" subtitle="Network health, usage, and revenue at a glance">
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <StatTile label="Total Stations" value={stations.length} />
        <StatTile label="Total Chargers" value={chargers.length} />
        <StatTile label="Active Sessions" value={activeSessions.length} />
        <StatTile
          label="Revenue Today"
          value={`₹${Number(revenueSummary.revenueToday || 0).toFixed(2)}`}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <GlassCard className="xl:col-span-2">
          <h2 className="mb-3 text-sm font-semibold text-white">Sessions Over Time</h2>
          <MiniBarChart rows={revenueSeries} labelKey="date" valueKey="sessions" />
        </GlassCard>
        <GlassCard>
          <h2 className="mb-3 text-sm font-semibold text-white">Revenue Trend</h2>
          <MiniBarChart rows={revenueSeries} labelKey="date" valueKey="revenue" />
        </GlassCard>
      </div>

      <GlassCard>
        <h2 className="mb-3 text-sm font-semibold text-white">Recent Alerts</h2>
        <div className="space-y-2">
          {alerts.slice(0, 6).map((alert) => (
            <div key={alert.id} className="rounded-xl border border-white/10 bg-black/20 p-3">
              <p className="text-sm text-white">{alert.message}</p>
              <p className="text-xs uppercase tracking-wider text-white/55">{alert.severity}</p>
            </div>
          ))}
          {alerts.length === 0 && <p className="text-sm text-white/60">No active alerts</p>}
        </div>
      </GlassCard>
    </PageSection>
  )
}
