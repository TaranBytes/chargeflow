import { useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { AlertCircle, ArrowRight, CheckCircle2 } from 'lucide-react'
import Button from '../components/common/Button.jsx'
import { request } from '../api/client.js'

function validate({ token, password, confirmPassword }) {
  const errors = {}
  if (!token?.trim()) errors.token = 'Reset token is required.'
  if (!password) errors.password = 'Password is required.'
  else if (password.length < 6) errors.password = 'Use at least 6 characters.'
  if (!confirmPassword) errors.confirmPassword = 'Confirm your password.'
  else if (confirmPassword !== password) errors.confirmPassword = 'Passwords do not match.'
  return errors
}

export default function ResetPasswordPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const initialToken = useMemo(() => searchParams.get('token') || '', [searchParams])

  const [form, setForm] = useState({
    token: initialToken,
    password: '',
    confirmPassword: '',
  })
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const [submitError, setSubmitError] = useState('')

  const setField = (name, value) => setForm((f) => ({ ...f, [name]: value }))

  const onSubmit = async (e) => {
    e.preventDefault()
    const v = validate(form)
    setErrors(v)
    if (Object.keys(v).length > 0) return

    setSubmitting(true)
    setSubmitError('')
    try {
      await request('post', '/auth/reset-password', {
        data: { token: form.token.trim(), newPassword: form.password },
      })
      setDone(true)
      setTimeout(() => navigate('/login', { replace: true }), 900)
    } catch (err) {
      setSubmitError(err?.message || 'Could not reset password.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-ev-canopy p-6">
      <div className="w-full max-w-md rounded-xl border border-white/10 bg-ev-sidebar/80 p-6 shadow-2xl shadow-black/35 backdrop-blur-xl">
        <h1 className="text-2xl font-bold text-white">Set a new password</h1>
        <p className="mt-1 text-sm text-white/70">Enter your reset token and choose a new password.</p>

        {submitError && (
          <div className="mt-5 flex items-start gap-2 rounded-lg border border-rose-500/40 bg-rose-500/10 px-3 py-2.5 text-xs text-rose-200">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{submitError}</span>
          </div>
        )}

        {done && (
          <div className="mt-5 flex items-start gap-2 rounded-lg border border-ev-gold/35 bg-[rgba(255,222,66,0.08)] px-3 py-2.5 text-xs text-white">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-ev-gold" />
            <span>Password reset successful. Redirecting to sign in…</span>
          </div>
        )}

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <Field
            label="Reset token"
            name="token"
            value={form.token}
            onChange={(v) => setField('token', v)}
            error={errors.token}
          />
          <Field
            label="New password"
            name="password"
            type="password"
            value={form.password}
            onChange={(v) => setField('password', v)}
            error={errors.password}
            autoComplete="new-password"
          />
          <Field
            label="Confirm new password"
            name="confirmPassword"
            type="password"
            value={form.confirmPassword}
            onChange={(v) => setField('confirmPassword', v)}
            error={errors.confirmPassword}
            autoComplete="new-password"
          />
          <Button
            type="submit"
            loading={submitting}
            disabled={done}
            fullWidth
            rightIcon={!submitting && !done ? <ArrowRight className="w-4 h-4" /> : null}
          >
            {submitting ? 'Resetting…' : 'Reset password'}
          </Button>
        </form>

        <p className="mt-4 text-center text-sm text-white/70">
          Back to{' '}
          <Link to="/login" className="font-medium text-ev-gold transition hover:text-ev-goldHover hover:underline">
            sign in
          </Link>
        </p>
      </div>
    </div>
  )
}

function Field({ label, name, type = 'text', value, onChange, error, ...rest }) {
  return (
    <div>
      <label htmlFor={name} className="mb-1.5 block text-xs font-semibold text-white/80">
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${name}-error` : undefined}
        className={`w-full rounded-lg border px-3 py-2.5 text-sm outline-none transition duration-250 focus:ring-2 ${
          error
            ? 'border-rose-500/60 bg-white text-ev-espresso focus:border-rose-500 focus:ring-rose-500/30'
            : 'border-white/12 bg-white text-ev-espresso placeholder:text-[#666666] focus:border-ev-moss focus:ring-ev-gold/25'
        }`}
        {...rest}
      />
      {error && (
        <p id={`${name}-error`} className="mt-1 flex items-center gap-1 text-[11px] text-rose-300">
          <AlertCircle className="h-3 w-3" /> {error}
        </p>
      )}
    </div>
  )
}

