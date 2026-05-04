import { useEffect, useState } from 'react'
import { adminApi } from '../api/admin.api.js'
import { GlassCard, MiniBarChart, PageSection, StatTile } from '../components/admin/AdminPanelPrimitives.jsx'

export default function AdminRevenuePage() {
  const [summary, setSummary] = useState({})
  const [series, setSeries] = useState([])
  const [days, setDays] = useState(7)

  useEffect(() => {
    adminApi.revenueSummary().then(setSummary).catch(() => setSummary({}))
  }, [])

  useEffect(() => {
    adminApi.revenueTimeseries(days).then(setSeries).catch(() => setSeries([]))
  }, [days])

  return (
    <PageSection
      title="Revenue"
      subtitle="Financial performance across stations"
      actions={
        <select
          value={days}
          onChange={(e) => setDays(Number(e.target.value))}
          className="rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm text-white"
        >
          <option value={7}>Last 7 days</option>
          <option value={30}>Last 30 days</option>
          <option value={90}>Last 90 days</option>
        </select>
      }
    >
      <div className="grid gap-3 md:grid-cols-3">
        <StatTile label="Total Revenue" value={`₹${Number(summary.totalRevenue || 0).toFixed(2)}`} />
        <StatTile label="Revenue Today" value={`₹${Number(summary.revenueToday || 0).toFixed(2)}`} />
        <StatTile label="Energy Delivered" value={`${Number(summary.totalEnergy || 0).toFixed(2)} kWh`} />
      </div>
      <GlassCard>
        <h2 className="mb-3 text-sm font-semibold text-white">Revenue Timeseries</h2>
        <MiniBarChart rows={series} labelKey="date" valueKey="revenue" />
      </GlassCard>
      <GlassCard>
        <h2 className="mb-3 text-sm font-semibold text-white">Revenue by Station</h2>
        <div className="space-y-2">
          {(summary.revenueByStation || []).map((row) => (
            <div key={row.stationId} className="flex items-center justify-between rounded-xl bg-black/20 p-3">
              <p className="text-sm text-white">{row.stationName || 'Unknown Station'}</p>
              <p className="text-sm font-semibold text-[#FFDE42]">₹{Number(row.revenue || 0).toFixed(2)}</p>
            </div>
          ))}
        </div>
      </GlassCard>
    </PageSection>
  )
}
