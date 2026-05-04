import { useEffect, useState } from 'react'
import { adminApi } from '../api/admin.api.js'
import { GlassCard, PageSection } from '../components/admin/AdminPanelPrimitives.jsx'

function formatDuration(startTime, endTime) {
  const start = new Date(startTime).getTime()
  const end = endTime ? new Date(endTime).getTime() : Date.now()
  const mins = Math.max(1, Math.floor((end - start) / 60000))
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return h ? `${h}h ${m}m` : `${m}m`
}

export default function AdminSessionsPage() {
  const [sessions, setSessions] = useState([])
  useEffect(() => {
    adminApi.listSessions().then(setSessions).catch(() => setSessions([]))
  }, [])

  return (
    <PageSection title="Sessions" subtitle="Live and historical charging sessions">
      <GlassCard className="overflow-x-auto">
        <table className="w-full min-w-[920px] text-left text-sm">
          <thead className="text-white/60">
            <tr>
              <th className="py-2">User</th>
              <th>Station</th>
              <th>Duration</th>
              <th>Energy</th>
              <th>Cost</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {sessions.map((s) => (
              <tr key={s.id} className="border-t border-white/10 text-white/90 hover:bg-white/5">
                <td className="py-2">{s.user?.name || s.user?.email || '-'}</td>
                <td>{s.station?.name || '-'}</td>
                <td>{formatDuration(s.startTime, s.endTime)}</td>
                <td>{Number(s.energyConsumed || 0).toFixed(2)} kWh</td>
                <td>₹{Number(s.cost || 0).toFixed(2)}</td>
                <td>
                  <span
                    className={`rounded-full px-2 py-1 text-xs ${
                      s.status === 'ACTIVE' ? 'bg-[#FFDE42]/20 text-[#FFDE42]' : 'bg-white/10 text-white/80'
                    }`}
                  >
                    {s.status.toLowerCase()}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </GlassCard>
    </PageSection>
  )
}
