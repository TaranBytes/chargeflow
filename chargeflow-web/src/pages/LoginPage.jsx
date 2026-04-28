import { useState } from 'react'
import { useNavigate, useLocation, Navigate } from 'react-router-dom'
import { Zap, ArrowRight, AlertCircle } from 'lucide-react'
import { useAuth } from '../hooks/useAuth.js'
import { useToast } from '../hooks/useToast.js'
import Button from '../components/common/Button.jsx'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function validate({ email, password }) {
  const errors = {}
  if (!email?.trim()) errors.email = 'Email is required.'
  else if (!EMAIL_RE.test(email)) errors.email = 'Enter a valid email address.'
  if (!password) errors.password = 'Password is required.'
  else if (password.length < 6) errors.password = 'Use at least 6 characters.'
  return errors
}

export default function LoginPage() {
  const { login, loading, user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const toast = useToast()

  const [form, setForm] = useState({ email: 'sahib@chargeflow.dev', password: 'demo1234' })
  const [errors, setErrors] = useState({})
  const [touched, setTouched] = useState({})
  const [submitError, setSubmitError] = useState(null)

  if (user) {
    return <Navigate to={location.state?.from?.pathname || '/'} replace />
  }

  const setField = (name, value) => {
    setForm((f) => ({ ...f, [name]: value }))
    if (touched[name]) {
      const next = validate({ ...form, [name]: value })
      setErrors(next)
    }
  }

  const handleBlur = (name) => {
    setTouched((t) => ({ ...t, [name]: true }))
    setErrors(validate(form))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const v = validate(form)
    setErrors(v)
    setTouched({ email: true, password: true })
    if (Object.keys(v).length > 0) return

    setSubmitError(null)
    try {
      await login(form.email, form.password)
      toast.success('Welcome back', 'Signed in successfully.')
      const dest = location.state?.from?.pathname || '/'
      navigate(dest, { replace: true })
    } catch (err) {
      const msg = err?.message || 'Could not sign in. Please try again.'
      setSubmitError(msg)
      toast.error('Sign-in failed', msg)
    }
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-slate-50">
      {/* Left brand panel */}
      <div className="hidden lg:flex flex-col justify-between p-10 bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 text-white relative overflow-hidden">
        <div className="flex items-center gap-2 relative z-10">
          <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur grid place-items-center">
            <Zap className="w-5 h-5" />
          </div>
          <span className="text-lg font-bold">ChargeFlow</span>
        </div>

        <div className="relative z-10 max-w-md">
          <h1 className="text-4xl font-bold leading-tight">
            Power your journey
            <br />
            with confidence.
          </h1>
          <p className="mt-4 text-emerald-100">
            Discover, book, and track your EV charging — across thousands of stations, in real time.
          </p>

          <div className="mt-8 grid grid-cols-3 gap-3">
            <Stat label="Stations" value="2.4k+" />
            <Stat label="Chargers" value="9.1k+" />
            <Stat label="Sessions/day" value="14k" />
          </div>
        </div>

        <p className="text-xs text-emerald-200/80 relative z-10">
          © {new Date().getFullYear()} ChargeFlow Inc.
        </p>

        <div className="absolute -right-32 -bottom-32 w-96 h-96 rounded-full bg-emerald-400/20 blur-3xl" />
        <div className="absolute -left-20 top-20 w-80 h-80 rounded-full bg-teal-400/20 blur-3xl" />
      </div>

      {/* Right form panel */}
      <div className="flex items-center justify-center p-6 lg:p-10">
        <div className="w-full max-w-sm">
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-9 h-9 rounded-xl bg-emerald-500 grid place-items-center text-white">
              <Zap className="w-5 h-5" />
            </div>
            <span className="text-lg font-bold">ChargeFlow</span>
          </div>
          <h2 className="text-2xl font-bold text-slate-900">Welcome back</h2>
          <p className="text-sm text-slate-500 mt-1">Sign in to access your dashboard.</p>

          {submitError && (
            <div className="mt-5 flex items-start gap-2 bg-rose-50 border border-rose-200 text-rose-700 px-3 py-2.5 rounded-lg text-xs">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{submitError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="mt-6 space-y-4">
            <Field
              label="Email"
              name="email"
              type="email"
              value={form.email}
              error={touched.email && errors.email}
              onChange={(v) => setField('email', v)}
              onBlur={() => handleBlur('email')}
              autoComplete="email"
              required
            />
            <Field
              label="Password"
              name="password"
              type="password"
              value={form.password}
              error={touched.password && errors.password}
              onChange={(v) => setField('password', v)}
              onBlur={() => handleBlur('password')}
              autoComplete="current-password"
              rightLabel={<a href="#" className="text-xs text-emerald-600 hover:underline">Forgot?</a>}
              required
            />

            <Button
              type="submit"
              loading={loading}
              fullWidth
              size="lg"
              rightIcon={!loading && <ArrowRight className="w-4 h-4" />}
            >
              {loading ? 'Signing in…' : 'Sign in'}
            </Button>
          </form>

          <p className="mt-6 text-xs text-slate-500 text-center">
            Demo build — any email + password works.
          </p>
        </div>
      </div>
    </div>
  )
}

function Field({ label, name, type, value, onChange, onBlur, error, rightLabel, ...rest }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <label htmlFor={name} className="block text-xs font-semibold text-slate-700">
          {label}
        </label>
        {rightLabel}
      </div>
      <input
        id={name}
        name={name}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        aria-invalid={!!error}
        aria-describedby={error ? `${name}-error` : undefined}
        className={`w-full bg-white border rounded-lg px-3 py-2.5 text-sm outline-none transition focus:ring-2 ${
          error
            ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-100'
            : 'border-slate-200 focus:border-emerald-500 focus:ring-emerald-100'
        }`}
        {...rest}
      />
      {error && (
        <p id={`${name}-error`} className="mt-1 text-[11px] text-rose-600 flex items-center gap-1">
          <AlertCircle className="w-3 h-3" /> {error}
        </p>
      )}
    </div>
  )
}

function Stat({ label, value }) {
  return (
    <div className="bg-white/10 backdrop-blur rounded-lg p-3 border border-white/10">
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-[11px] text-emerald-100 uppercase tracking-wide">{label}</p>
    </div>
  )
}
