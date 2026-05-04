import { useState } from 'react'
import { useAuth } from '../hooks/useAuth.js'
import { Car, Mail, User as UserIcon, Shield, LogOut, Plus } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export default function ProfilePage() {
  const { user, addVehicle, removeVehicle } = useAuth()
  const navigate = useNavigate()
  const [isAddingVehicle, setIsAddingVehicle] = useState(false)
  const [isSavingVehicle, setIsSavingVehicle] = useState(false)
  const [removingVehicleIndex, setRemovingVehicleIndex] = useState(null)
  const [vehicleForm, setVehicleForm] = useState({
    make: '',
    model: '',
    batteryKWh: '',
    connectorType: 'Type2',
  })
  if (!user) return null

  const handleVehicleFieldChange = (event) => {
    const { name, value } = event.target
    setVehicleForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleAddVehicle = async (event) => {
    event.preventDefault()
    const make = vehicleForm.make.trim()
    const model = vehicleForm.model.trim()
    const batteryKWh = Number(vehicleForm.batteryKWh)
    if (!make || !model || !Number.isFinite(batteryKWh) || batteryKWh <= 0) return

    try {
      setIsSavingVehicle(true)
      await addVehicle({
        make,
        model,
        batteryKWh,
        connectorType: vehicleForm.connectorType,
      })
      setVehicleForm({ make: '', model: '', batteryKWh: '', connectorType: 'Type2' })
      setIsAddingVehicle(false)
    } finally {
      setIsSavingVehicle(false)
    }
  }

  const handleRemoveVehicle = async (index) => {
    try {
      setRemovingVehicleIndex(index)
      await removeVehicle(index)
    } finally {
      setRemovingVehicleIndex(null)
    }
  }

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
          <button
            type="button"
            onClick={() => setIsAddingVehicle((prev) => !prev)}
            className="inline-flex items-center gap-1 text-xs font-medium text-ev-aqua transition hover:text-ev-mint hover:underline"
          >
            <Plus className="w-3 h-3" /> Add vehicle
          </button>
        </div>
        {isAddingVehicle && (
          <form
            onSubmit={handleAddVehicle}
            className="mb-4 grid gap-2 md:grid-cols-2 p-3 bg-slate-50 border border-slate-200 rounded-lg"
          >
            <input
              name="make"
              value={vehicleForm.make}
              onChange={handleVehicleFieldChange}
              placeholder="Make (e.g., Tesla)"
              className="px-3 py-2 rounded-md border border-slate-300 text-sm"
              disabled={isSavingVehicle}
              required
            />
            <input
              name="model"
              value={vehicleForm.model}
              onChange={handleVehicleFieldChange}
              placeholder="Model (e.g., Model 3)"
              className="px-3 py-2 rounded-md border border-slate-300 text-sm"
              disabled={isSavingVehicle}
              required
            />
            <input
              name="batteryKWh"
              type="number"
              min="1"
              step="1"
              value={vehicleForm.batteryKWh}
              onChange={handleVehicleFieldChange}
              placeholder="Battery (kWh)"
              className="px-3 py-2 rounded-md border border-slate-300 text-sm"
              disabled={isSavingVehicle}
              required
            />
            <select
              name="connectorType"
              value={vehicleForm.connectorType}
              onChange={handleVehicleFieldChange}
              className="px-3 py-2 rounded-md border border-slate-300 text-sm"
              disabled={isSavingVehicle}
            >
              <option value="Type2">Type2</option>
              <option value="CCS">CCS</option>
              <option value="CHAdeMO">CHAdeMO</option>
              <option value="Tesla">Tesla</option>
            </select>
            <div className="md:col-span-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsAddingVehicle(false)}
                className="px-3 py-2 text-sm rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-100"
                disabled={isSavingVehicle}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-3 py-2 text-sm rounded-lg bg-ev-aqua text-white hover:bg-ev-aqua/90"
                disabled={isSavingVehicle}
              >
                {isSavingVehicle ? 'Saving...' : 'Save vehicle'}
              </button>
            </div>
          </form>
        )}
        <div className="space-y-2">
          {user.vehicles?.map((v, index) => (
            <div
              key={v.id || `${v.make}-${v.model}-${v.connectorType}-${index}`}
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
              <button
                type="button"
                onClick={() => handleRemoveVehicle(index)}
                disabled={removingVehicleIndex === index}
                className="ml-auto px-2.5 py-1.5 text-xs rounded-md border border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {removingVehicleIndex === index ? 'Removing...' : 'Remove'}
              </button>
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
