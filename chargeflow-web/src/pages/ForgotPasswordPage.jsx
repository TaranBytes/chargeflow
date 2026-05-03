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
    <div className="min-h-screen grid lg:grid-cols-2 bg-slate-950">
      <div className="hidden lg:flex flex-col justify-between p-10 bg-gradient-to-br from-slate-900 via-slate-950 to-black text-white relative overflow-hidden border-r border-slate-800">
        <div className="flex items-center gap-2 relative z-10">
          <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur grid place-items-center">
            <Zap className="w-5 h-5" />
          </div>
          <span className="text-lg font-bold">ChargeFlow</span>
        </div>
        <div className="relative z-10 max-w-md">
          <h1 className="text-4xl font-bold leading-tight">Reset your password</h1>
          <p className="mt-4 text-emerald-100">
            Enter your account email and we will help you reset access securely.
          </p>
        </div>
      </div>

      <div className="flex items-center justify-center p-6 lg:p-10">
        <div className="w-full max-w-sm bg-slate-900/70 border border-slate-800 rounded-2xl p-6 sm:p-7 shadow-2xl shadow-black/30 backdrop-blur">
          <h2 className="text-2xl font-bold text-slate-100">Forgot password</h2>
          <p className="text-sm text-slate-400 mt-1">We will generate a reset token for your account.</p>

          {error && (
            <div className="mt-5 flex items-start gap-2 bg-rose-900/25 border border-rose-800/80 text-rose-300 px-3 py-2.5 rounded-lg text-xs">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {result && (
            <div className="mt-5 space-y-3 rounded-lg border border-emerald-800/70 bg-emerald-900/20 p-3 text-sm text-emerald-200">
              <p className="inline-flex items-center gap-2 font-medium">
                <CheckCircle2 className="h-4 w-4" />
                If this email exists, reset instructions are ready.
              </p>
              {result.resetToken ? (
                <>
                  <p className="text-xs text-emerald-300">
                    Demo token (dev-only): <code className="bg-slate-900 px-1 rounded">{result.resetToken}</code>
                  </p>
                  <Link
                    to={`/reset-password?token=${encodeURIComponent(result.resetToken)}`}
                    className="inline-flex items-center gap-1 text-emerald-300 font-medium hover:underline"
                  >
                    Continue to reset password <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </>
              ) : (
                <p className="text-xs text-emerald-300">
                  Check your email inbox for a reset link.
                </p>
              )}
            </div>
          )}

          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <div>
              <label htmlFor="email" className="block text-xs font-semibold text-slate-300 mb-1.5">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-slate-100 outline-none transition focus:ring-2 focus:border-emerald-500 focus:ring-emerald-900/30"
                autoComplete="email"
                required
              />
            </div>
            <Button type="submit" loading={submitting} fullWidth size="lg">
              {submitting ? 'Sending…' : 'Send reset link'}
            </Button>
          </form>

          <p className="mt-4 text-sm text-slate-400 text-center">
            Remembered your password?{' '}
            <Link to="/login" className="text-emerald-600 hover:underline font-medium">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

