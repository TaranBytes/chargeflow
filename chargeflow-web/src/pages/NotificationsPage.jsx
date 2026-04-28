import { mockNotifications } from '../utils/mockData.js'
import { Bell, CalendarCheck, Activity, Sparkles } from 'lucide-react'

const ICONS = { booking: CalendarCheck, session: Activity, system: Sparkles }

export default function NotificationsPage() {
  return (
    <div className="p-4 lg:p-6 max-w-3xl mx-auto space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Notifications</h1>
        <p className="text-sm text-slate-500 mt-1">Booking, session, and system updates.</p>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl divide-y divide-slate-100 overflow-hidden">
        {mockNotifications.length === 0 && (
          <div className="p-8 text-center text-sm text-slate-500">No notifications yet.</div>
        )}
        {mockNotifications.map((n) => {
          const Icon = ICONS[n.type] || Bell
          return (
            <div key={n.id} className="p-4 flex gap-3 hover:bg-slate-50 transition">
              <div
                className={`w-10 h-10 rounded-lg grid place-items-center shrink-0 ${
                  n.read
                    ? 'bg-slate-100 text-slate-500'
                    : 'bg-emerald-50 text-emerald-700'
                }`}
              >
                <Icon className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p
                    className={`text-sm font-semibold ${
                      n.read ? 'text-slate-700' : 'text-slate-900'
                    }`}
                  >
                    {n.title}
                  </p>
                  <span className="text-xs text-slate-400 shrink-0">
                    {new Date(n.ts).toLocaleString()}
                  </span>
                </div>
                <p className="text-sm text-slate-600 mt-0.5">{n.body}</p>
              </div>
              {!n.read && (
                <span className="w-2 h-2 rounded-full bg-emerald-500 mt-2 shrink-0" />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
