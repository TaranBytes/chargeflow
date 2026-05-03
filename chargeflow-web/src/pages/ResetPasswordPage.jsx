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
    <div className="min-h-screen flex items-center justify-center bg-slate-950 p-6">
      <div className="w-full max-w-md bg-slate-900/70 rounded-xl border border-slate-800 p-6 shadow-2xl shadow-black/30 backdrop-blur">
        <h1 className="text-2xl font-bold text-slate-100">Set a new password</h1>
        <p className="text-sm text-slate-400 mt-1">
          Enter your reset token and choose a new password.
        </p>

        {submitError && (
          <div className="mt-5 flex items-start gap-2 bg-rose-900/25 border border-rose-800/80 text-rose-300 px-3 py-2.5 rounded-lg text-xs">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <span>{submitError}</span>
          </div>
        )}

        {done && (
          <div className="mt-5 flex items-start gap-2 bg-emerald-900/20 border border-emerald-800/70 text-emerald-300 px-3 py-2.5 rounded-lg text-xs">
            <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
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

        <p className="mt-4 text-sm text-slate-400 text-center">
          Back to{' '}
          <Link to="/login" className="text-emerald-600 hover:underline font-medium">
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
      <label htmlFor={name} className="block text-xs font-semibold text-slate-300 mb-1.5">
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
        className={`w-full bg-slate-900 border rounded-lg px-3 py-2.5 text-sm text-slate-100 outline-none transition focus:ring-2 ${
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

