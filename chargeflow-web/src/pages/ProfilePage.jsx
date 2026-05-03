import { useAuth } from '../hooks/useAuth.js'
import { Car, Mail, User as UserIcon, Shield, LogOut, Plus } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export default function ProfilePage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  if (!user) return null

  return (
    <div className="p-4 lg:p-6 max-w-3xl mx-auto space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Profile</h1>
        <p className="text-sm text-slate-500 mt-1">Account, vehicles, and preferences.</p>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-5 flex items-center gap-4">
        <img
          src={user.avatar}
          alt={user.name}
          className="h-16 w-16 rounded-full bg-white/20 ring-4 ring-ev-gold/20"
        />
        <div className="min-w-0">
          <p className="text-lg font-bold text-slate-900 truncate">{user.name}</p>
          <p className="text-sm text-slate-500 truncate">{user.email}</p>
        </div>
        <button
          onClick={() => navigate('/logout')}
          className="ml-auto inline-flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium px-3 py-2 rounded-lg shrink-0"
        >
          <LogOut className="w-4 h-4" /> Log out
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-5">
        <h2 className="text-base font-semibold text-slate-900 mb-3">Account info</h2>
        <Row icon={UserIcon} label="Name" value={user.name} />
        <Row icon={Mail} label="Email" value={user.email} />
        <Row icon={Shield} label="Role" value={user.role} />
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold text-slate-900">My vehicles</h2>
          <button className="inline-flex items-center gap-1 text-xs font-medium text-ev-aqua transition hover:text-ev-mint hover:underline">
            <Plus className="w-3 h-3" /> Add vehicle
          </button>
        </div>
        <div className="space-y-2">
          {user.vehicles?.map((v) => (
            <div
              key={v.id}
              className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100"
            >
              <div className="w-10 h-10 rounded-lg bg-white grid place-items-center shadow-sm">
                <Car className="w-5 h-5 text-slate-500" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-900">
                  {v.make} {v.model}
                </p>
                <p className="text-xs text-slate-500">
                  {v.batteryKWh} kWh battery · {v.connectorType}
                </p>
              </div>
            </div>
          ))}
          {(!user.vehicles || user.vehicles.length === 0) && (
            <p className="text-sm text-slate-500">No vehicles added yet.</p>
          )}
        </div>
      </div>
    </div>
  )
}

function Row({ icon: Icon, label, value }) {
  return (
    <div className="py-2.5 flex items-center gap-3 border-b border-slate-100 last:border-0">
      <Icon className="w-4 h-4 text-slate-400" />
      <span className="text-xs text-slate-500 w-20">{label}</span>
      <span className="text-sm font-medium text-slate-900">{value}</span>
    </div>
  )
}
