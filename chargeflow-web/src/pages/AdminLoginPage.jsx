import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ShieldCheck } from 'lucide-react'
import { useAuth } from '../hooks/useAuth.js'

export default function AdminLoginPage() {
  const navigate = useNavigate()
  const { adminLogin, loading } = useAuth()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')

  const onChange = (event) => {
    const { name, value } = event.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const onSubmit = async (event) => {
    event.preventDefault()
    setError('')
    try {
      const session = await adminLogin(form.email, form.password)
      if (session?.role !== 'admin') {
        setError('Only admin users can access this panel.')
        return
      }
      navigate('/admin/dashboard', { replace: true })
    } catch (err) {
      setError(err.message || 'Admin login failed')
    }
  }

  return (
    <div className="min-h-screen grid place-items-center px-4">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#221414]/80 p-6 shadow-2xl shadow-black/40 backdrop-blur-xl">
        <div className="mb-5 flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-xl bg-[#FFDE42]/20">
            <ShieldCheck className="h-5 w-5 text-[#FFDE42]" />
          </div>
          <div>
            <p className="text-lg font-semibold text-white">Admin Access</p>
            <p className="text-xs text-white/60">ChargeFlow control center</p>
          </div>
        </div>
        <form onSubmit={onSubmit} className="space-y-3">
          <input
            type="email"
            name="email"
            value={form.email}
            onChange={onChange}
            placeholder="Admin email"
            className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white placeholder:text-white/50 focus:border-[#FFDE42]/50 focus:outline-none"
            required
          />
          <input
            type="password"
            name="password"
            value={form.password}
            onChange={onChange}
            placeholder="Password"
            className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white placeholder:text-white/50 focus:border-[#FFDE42]/50 focus:outline-none"
            required
          />
          {error && <p className="text-xs text-rose-300">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-[#FFDE42] px-4 py-2.5 text-sm font-semibold text-[#1B0C0C] transition hover:bg-[#f4d027] disabled:opacity-60"
          >
            {loading ? 'Signing in...' : 'Login as admin'}
          </button>
        </form>
      </div>
    </div>
  )
}
