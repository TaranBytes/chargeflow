import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { Zap, ArrowRight, AlertCircle } from 'lucide-react'
import { useAuth } from '../hooks/useAuth.js'
import { useToast } from '../hooks/useToast.js'
import Button from '../components/common/Button.jsx'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function validate({ name, email, phone, password, confirmPassword }) {
  const errors = {}
  if (!name?.trim()) errors.name = 'Name is required.'
  else if (name.trim().length < 2) errors.name = 'Use at least 2 characters.'

  if (!email?.trim()) errors.email = 'Email is required.'
  else if (!EMAIL_RE.test(email)) errors.email = 'Enter a valid email address.'

  if (phone && !/^[\d+\-\s()]{7,20}$/.test(phone)) {
    errors.phone = 'Enter a valid phone number.'
  }

  if (!password) errors.password = 'Password is required.'
  else if (password.length < 6) errors.password = 'Use at least 6 characters.'

  if (!confirmPassword) errors.confirmPassword = 'Confirm your password.'
  else if (confirmPassword !== password) errors.confirmPassword = 'Passwords do not match.'
  return errors
}

export default function SignupPage() {
  const { signup, loading, user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const toast = useToast()

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  })
  const [errors, setErrors] = useState({})
  const [touched, setTouched] = useState({})
  const [submitError, setSubmitError] = useState(null)

  if (user) {
    return <Navigate to={location.state?.from?.pathname || '/'} replace />
  }

  const setField = (name, value) => {
    setForm((f) => ({ ...f, [name]: value }))
    if (touched[name]) setErrors(validate({ ...form, [name]: value }))
  }

  const handleBlur = (name) => {
    setTouched((t) => ({ ...t, [name]: true }))
    setErrors(validate(form))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const v = validate(form)
    setErrors(v)
    setTouched({
      name: true,
      email: true,
      phone: true,
      password: true,
      confirmPassword: true,
    })
    if (Object.keys(v).length > 0) return

    setSubmitError(null)
    try {
      await signup({
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        phone: form.phone.trim(),
        password: form.password,
      })
      toast.success('Account created', 'Welcome to ChargeFlow.')
      navigate(location.state?.from?.pathname || '/', { replace: true })
    } catch (err) {
      const msg = err?.message || 'Could not create account. Please try again.'
      setSubmitError(msg)
      toast.error('Sign-up failed', msg)
    }
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-slate-950">
      <div className="hidden lg:flex flex-col justify-between p-10 bg-gradient-to-br from-slate-900 via-slate-950 to-black text-white relative overflow-hidden border-r border-slate-800">
        <div className="flex items-center gap-2 relative z-10">
          <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur grid place-items-center">
            <Zap className="w-5 h-5" />
          </div>
          <span className="text-lg font-bold">ChargeFlow</span>
        </div>
        <div className="relative z-10 max-w-md">
          <h1 className="text-4xl font-bold leading-tight">Create your ChargeFlow account.</h1>
          <p className="mt-4 text-emerald-100">
            One account to discover stations, book slots, and track charging sessions in real time.
          </p>
        </div>
        <p className="text-xs text-emerald-200/80 relative z-10">
          © {new Date().getFullYear()} ChargeFlow Inc.
        </p>
      </div>

      <div className="flex items-center justify-center p-6 lg:p-10">
        <div className="w-full max-w-sm bg-slate-900/70 border border-slate-800 rounded-2xl p-6 sm:p-7 shadow-2xl shadow-black/30 backdrop-blur">
          <h2 className="text-2xl font-bold text-slate-100">Create account</h2>
          <p className="text-sm text-slate-400 mt-1">Sign up and start booking chargers.</p>

          {submitError && (
            <div className="mt-5 flex items-start gap-2 bg-rose-900/25 border border-rose-800/80 text-rose-300 px-3 py-2.5 rounded-lg text-xs">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{submitError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="mt-6 space-y-4">
            <Field
              label="Full name"
              name="name"
              type="text"
              value={form.name}
              error={touched.name && errors.name}
              onChange={(v) => setField('name', v)}
              onBlur={() => handleBlur('name')}
              autoComplete="name"
              required
            />
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
              label="Phone (optional)"
              name="phone"
              type="tel"
              value={form.phone}
              error={touched.phone && errors.phone}
              onChange={(v) => setField('phone', v)}
              onBlur={() => handleBlur('phone')}
              autoComplete="tel"
            />
            <Field
              label="Password"
              name="password"
              type="password"
              value={form.password}
              error={touched.password && errors.password}
              onChange={(v) => setField('password', v)}
              onBlur={() => handleBlur('password')}
              autoComplete="new-password"
              required
            />
            <Field
              label="Confirm password"
              name="confirmPassword"
              type="password"
              value={form.confirmPassword}
              error={touched.confirmPassword && errors.confirmPassword}
              onChange={(v) => setField('confirmPassword', v)}
              onBlur={() => handleBlur('confirmPassword')}
              autoComplete="new-password"
              required
            />

            <Button
              type="submit"
              loading={loading}
              fullWidth
              size="lg"
              rightIcon={!loading && <ArrowRight className="w-4 h-4" />}
            >
              {loading ? 'Creating account…' : 'Create account'}
            </Button>
          </form>

          <p className="mt-6 text-sm text-slate-400 text-center">
            Already have an account?{' '}
            <Link to="/login" className="text-emerald-600 hover:underline font-medium">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

function Field({ label, name, type, value, onChange, onBlur, error, ...rest }) {
  return (
    <div>
      <label htmlFor={name} className="block text-xs font-semibold text-slate-300 mb-1.5">
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        aria-invalid={!!error}
        aria-describedby={error ? `${name}-error` : undefined}
        className={`w-full bg-slate-900 border rounded-lg px-3 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 outline-none transition focus:ring-2 ${
          error
            ? 'border-rose-700 focus:border-rose-500 focus:ring-rose-900/50'
            : 'border-slate-700 focus:border-emerald-500 focus:ring-emerald-900/30'
        }`}
        {...rest}
      />
      {error && (
        <p id={`${name}-error`} className="mt-1 text-[11px] text-rose-400 flex items-center gap-1">
          <AlertCircle className="w-3 h-3" /> {error}
        </p>
      )}
    </div>
  )
}

