import { useState } from 'react'
import { Link } from 'react-router-dom'
import { AlertCircle, ArrowRight, CheckCircle2, Zap } from 'lucide-react'
import Button from '../components/common/Button.jsx'
import { request } from '../api/client.js'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState(null)

  const onSubmit = async (e) => {
    e.preventDefault()
    const normalized = email.trim().toLowerCase()
    if (!EMAIL_RE.test(normalized)) {
      setError('Enter a valid email address.')
      return
    }
    setError('')
    setSubmitting(true)
    try {
      const data = await request('post', '/auth/forgot-password', {
        data: { email: normalized },
      })
      setResult(data)
    } catch (err) {
      setError(err?.message || 'Could not process request right now.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="grid min-h-screen bg-ev-canopy lg:grid-cols-2">
      <div className="relative hidden flex-col justify-between overflow-hidden border-r border-white/10 p-10 text-white lg:flex">
        <div
          className="absolute inset-0 bg-gradient-to-br from-ev-canopy via-ev-sidebar to-ev-moss"
          aria-hidden
        />
        <div className="pointer-events-none absolute -bottom-20 right-0 h-72 w-72 rounded-full bg-ev-olive/12 blur-3xl" />
        <div className="relative z-10 flex items-center gap-2">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-white/15 backdrop-blur">
            <Zap className="h-5 w-5 text-ev-gold" />
          </div>
          <span className="text-lg font-bold">ChargeFlow</span>
        </div>
        <div className="relative z-10 max-w-md">
          <h1 className="text-4xl font-bold leading-tight">Reset your password</h1>
          <p className="mt-4 text-white/80">
            Enter your account email and we will help you reset access securely.
          </p>
        </div>
      </div>

      <div className="flex items-center justify-center p-6 lg:p-10">
        <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-ev-sidebar/80 p-6 shadow-2xl shadow-black/35 backdrop-blur-xl sm:p-7">
          <h2 className="text-2xl font-bold text-white">Forgot password</h2>
          <p className="mt-1 text-sm text-white/70">We will generate a reset token for your account.</p>

          {error && (
            <div className="mt-5 flex items-start gap-2 rounded-lg border border-rose-500/40 bg-rose-500/10 px-3 py-2.5 text-xs text-rose-200">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {result && (
            <div className="mt-5 space-y-3 rounded-lg border border-ev-gold/35 bg-[rgba(255,222,66,0.08)] p-3 text-sm text-white">
              <p className="inline-flex items-center gap-2 font-medium text-white">
                <CheckCircle2 className="h-4 w-4 text-ev-gold" />
                If this email exists, reset instructions are ready.
              </p>
              {result.resetToken ? (
                <>
                  <p className="text-xs text-white/80">
                    Demo token (dev-only):{' '}
                    <code className="rounded bg-black/30 px-1 text-ev-gold">{result.resetToken}</code>
                  </p>
                  <Link
                    to={`/reset-password?token=${encodeURIComponent(result.resetToken)}`}
                    className="inline-flex items-center gap-1 font-medium text-ev-gold transition hover:text-ev-goldHover hover:underline"
                  >
                    Continue to reset password <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </>
              ) : (
                <p className="text-xs text-white/80">Check your email inbox for a reset link.</p>
              )}
            </div>
          )}

          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <div>
              <label htmlFor="email" className="mb-1.5 block text-xs font-semibold text-white/80">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-white/12 bg-white px-3 py-2.5 text-sm text-ev-espresso outline-none transition duration-250 placeholder:text-[#666666] focus:border-ev-moss focus:ring-2 focus:ring-ev-gold/25"
                autoComplete="email"
                required
              />
            </div>
            <Button type="submit" loading={submitting} fullWidth size="lg">
              {submitting ? 'Sending…' : 'Send reset link'}
            </Button>
          </form>

          <p className="mt-4 text-center text-sm text-white/70">
            Remembered your password?{' '}
            <Link to="/login" className="font-medium text-ev-gold transition hover:text-ev-goldHover hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

