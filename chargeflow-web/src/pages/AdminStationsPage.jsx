import { useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { adminApi } from '../api/admin.api.js'
import { GlassCard, PageSection } from '../components/admin/AdminPanelPrimitives.jsx'

const initialForm = { name: '', address: '', lat: '', lng: '', pricingPerKWh: '', status: 'active' }

export default function AdminStationsPage() {
  const [stations, setStations] = useState([])
  const [q, setQ] = useState('')
  const [status, setStatus] = useState('')
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(initialForm)

  const load = async () => {
    const data = await adminApi.listStations({ q: q || undefined, status: status || undefined })
    setStations(data || [])
  }
  useEffect(() => {
    load()
  }, [])

  const filtered = useMemo(() => stations, [stations])

  const submit = async (event) => {
    event.preventDefault()
    const payload = {
      ...form,
      lat: Number(form.lat),
      lng: Number(form.lng),
      pricingPerKWh: Number(form.pricingPerKWh),
    }
    if (editing) await adminApi.updateStation(editing.id, payload)
    else await adminApi.createStation(payload)
    setOpen(false)
    setEditing(null)
    setForm(initialForm)
    await load()
  }

  return (
    <PageSection
      title="Stations"
      subtitle="Create, search, and maintain station inventory"
      actions={
        <button
          onClick={() => setOpen(true)}
          className="rounded-xl bg-[#FFDE42] px-4 py-2 text-sm font-semibold text-[#1B0C0C]"
        >
          Add Station
        </button>
      }
    >
      <GlassCard>
        <div className="mb-3 flex flex-wrap gap-2">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search stations"
            className="rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm text-white"
          />
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm text-white"
          >
            <option value="">All statuses</option>
            <option value="active">Active</option>
            <option value="maintenance">Maintenance</option>
            <option value="offline">Offline</option>
          </select>
          <button onClick={load} className="rounded-lg border border-white/20 px-3 py-2 text-xs text-white/80">
            Apply
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="text-white/60">
              <tr>
                <th className="py-2">Name</th>
                <th>Address</th>
                <th>Pricing</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => (
                <tr key={s.id} className="border-t border-white/10 text-white/90 hover:bg-white/5">
                  <td className="py-2">{s.name}</td>
                  <td>{s.address?.line1 || '-'}</td>
                  <td>₹{Number(s.pricingPerKWh || 0).toFixed(2)}/kWh</td>
                  <td className="capitalize">{s.status}</td>
                  <td className="space-x-2 text-right">
                    <button
                      onClick={() => {
                        setEditing(s)
                        setForm({
                          name: s.name || '',
                          address: s.address?.line1 || '',
                          lat: s.location?.lat || '',
                          lng: s.location?.lng || '',
                          pricingPerKWh: s.pricingPerKWh || '',
                          status: s.status || 'active',
                        })
                        setOpen(true)
                      }}
                      className="rounded-md border border-white/20 px-2 py-1 text-xs"
                    >
                      Edit
                    </button>
                    <button
                      onClick={async () => {
                        await adminApi.deleteStation(s.id)
                        await load()
                      }}
                      className="rounded-md border border-rose-300/60 px-2 py-1 text-xs text-rose-200"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassCard>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4"
          >
            <motion.form
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              onSubmit={submit}
              className="w-full max-w-xl space-y-3 rounded-2xl border border-white/10 bg-[#221414] p-5"
            >
              <p className="text-lg font-semibold text-white">{editing ? 'Edit station' : 'Add station'}</p>
              <input required placeholder="Name" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} className="w-full rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm text-white" />
              <input required placeholder="Address" value={form.address} onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))} className="w-full rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm text-white" />
              <div className="grid grid-cols-2 gap-2">
                <input required type="number" step="any" placeholder="Latitude" value={form.lat} onChange={(e) => setForm((p) => ({ ...p, lat: e.target.value }))} className="rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm text-white" />
                <input required type="number" step="any" placeholder="Longitude" value={form.lng} onChange={(e) => setForm((p) => ({ ...p, lng: e.target.value }))} className="rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm text-white" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input required type="number" min="0" step="0.01" placeholder="Pricing / kWh" value={form.pricingPerKWh} onChange={(e) => setForm((p) => ({ ...p, pricingPerKWh: e.target.value }))} className="rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm text-white" />
                <select value={form.status} onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))} className="rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm text-white">
                  <option value="active">Active</option>
                  <option value="maintenance">Maintenance</option>
                  <option value="offline">Offline</option>
                </select>
              </div>
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setOpen(false)} className="rounded-lg border border-white/20 px-3 py-2 text-sm text-white/80">Cancel</button>
                <button type="submit" className="rounded-lg bg-[#FFDE42] px-3 py-2 text-sm font-semibold text-[#1B0C0C]">
                  {editing ? 'Save changes' : 'Create station'}
                </button>
              </div>
            </motion.form>
          </motion.div>
        )}
      </AnimatePresence>
    </PageSection>
  )
}
