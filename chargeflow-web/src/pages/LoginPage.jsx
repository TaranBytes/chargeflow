import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate, useLocation, Navigate, Link } from 'react-router-dom'
import { LazyMotion, domAnimation, m, AnimatePresence, useReducedMotion } from 'framer-motion'
import { ArrowRight, AlertCircle, X } from 'lucide-react'
import { useAuth } from '../hooks/useAuth.js'
import { useToast } from '../hooks/useToast.js'
import Button from '../components/common/Button.jsx'
import LandingNavbar from '../components/landing/LandingNavbar.jsx'
import HeroSection from '../components/landing/HeroSection.jsx'
import LandingSections from '../components/landing/LandingSections.jsx'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function validateLogin({ email, password }) {
  const errors = {}
  if (!email?.trim()) errors.email = 'Email is required.'
  else if (!EMAIL_RE.test(email)) errors.email = 'Enter a valid email address.'
  if (!password) errors.password = 'Password is required.'
  else if (password.length < 6) errors.password = 'Use at least 6 characters.'
  return errors
}

function validateSignup({ name, email, password, confirmPassword }) {
  const errors = {}
  if (!name?.trim()) errors.name = 'Name is required.'
  else if (name.trim().length < 2) errors.name = 'Use at least 2 characters.'
  if (!email?.trim()) errors.email = 'Email is required.'
  else if (!EMAIL_RE.test(email)) errors.email = 'Enter a valid email address.'
  if (!password) errors.password = 'Password is required.'
  else if (password.length < 6) errors.password = 'Use at least 6 characters.'
  if (!confirmPassword) errors.confirmPassword = 'Confirm your password.'
  else if (confirmPassword !== password) errors.confirmPassword = 'Passwords do not match.'
  return errors
}

function scrollToId(id) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

function AuthField({ label, name, type, value, onChange, onBlur, error, rightLabel, autoComplete }) {
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <label htmlFor={`auth-${name}`} className="text-xs font-semibold text-white/80">{label}</label>
        {rightLabel}
      </div>
      <input
        id={`auth-${name}`} name={name} type={type} value={value}
        onChange={(e) => onChange(e.target.value)} onBlur={onBlur}
        autoComplete={autoComplete} aria-invalid={!!error}
        aria-describedby={error ? `auth-${name}-err` : undefined}
        className={`w-full rounded-xl border px-3.5 py-3 text-sm outline-none transition duration-200 focus:ring-2 ${
          error
            ? 'border-rose-500/60 bg-white text-[#1B0C0C] focus:border-rose-500 focus:ring-rose-500/30'
            : 'border-white/12 bg-white/95 text-[#1B0C0C] placeholder:text-[#666] focus:border-[#4C5C2D] focus:ring-[#FFDE42]/28'
        }`}
      />
      {error && (
        <p id={`auth-${name}-err`} className="mt-1 flex items-center gap-1 text-[11px] text-rose-300">
          <AlertCircle className="h-3 w-3 shrink-0" /> {error}
        </p>
      )}
    </div>
  )
}

const glowTap = { scale: 0.98 }

export default function LoginPage({ initialAuthOpen = false, initialAuthMode = 'login' } = {}) {
  const { login, signup, loading, user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const toast = useToast()
  const reduceMotion = useReducedMotion()

  const [authOpen, setAuthOpen] = useState(initialAuthOpen)
  const [authMode, setAuthMode] = useState(initialAuthMode)
  const navAfterCloseRef = useRef(null)

  const [loginForm, setLoginForm] = useState({ email: '', password: '' })
  const [loginErrors, setLoginErrors] = useState({})
  const [loginTouched, setLoginTouched] = useState({})
  const [loginSubmitError, setLoginSubmitError] = useState(null)

  const [signupForm, setSignupForm] = useState({ name: '', email: '', password: '', confirmPassword: '' })
  const [signupErrors, setSignupErrors] = useState({})
  const [signupTouched, setSignupTouched] = useState({})
  const [signupSubmitError, setSignupSubmitError] = useState(null)

  useEffect(() => { if (initialAuthOpen) setAuthOpen(true); setAuthMode(initialAuthMode) }, [initialAuthOpen, initialAuthMode])
  useEffect(() => { if (!authOpen) return; const p = document.body.style.overflow; document.body.style.overflow = 'hidden'; return () => { document.body.style.overflow = p } }, [authOpen])

  const handleExitComplete = useCallback(() => {
    const dest = navAfterCloseRef.current; navAfterCloseRef.current = null
    if (dest) navigate(dest, { replace: true })
    else if (location.pathname === '/signup') navigate('/login', { replace: true })
  }, [location.pathname, navigate])

  const pulseClose = useCallback((c = true) => { if (c) navAfterCloseRef.current = null; setAuthOpen(false) }, [])
  useEffect(() => { if (!authOpen) return; const h = (e) => { if (e.key === 'Escape') pulseClose(true) }; window.addEventListener('keydown', h); return () => window.removeEventListener('keydown', h) }, [authOpen, pulseClose])

  const openLogin = () => { setAuthMode('login'); setAuthOpen(true); setLoginSubmitError(null); setSignupSubmitError(null) }
  const openSignup = () => { setAuthMode('signup'); setAuthOpen(true); setLoginSubmitError(null); setSignupSubmitError(null) }
  const setLoginField = (n, v) => { setLoginForm((f) => ({ ...f, [n]: v })); if (loginTouched[n]) setLoginErrors(validateLogin({ ...loginForm, [n]: v })) }
  const setSignupField = (n, v) => { setSignupForm((f) => ({ ...f, [n]: v })); if (signupTouched[n]) setSignupErrors(validateSignup({ ...signupForm, [n]: v })) }

  const onLoginSubmit = async (e) => {
    e.preventDefault()
    const v = validateLogin(loginForm); setLoginErrors(v); setLoginTouched({ email: true, password: true })
    if (Object.keys(v).length > 0) return
    setLoginSubmitError(null)
    try {
      await login(loginForm.email.trim(), loginForm.password)
      toast.success('Welcome back', 'Signed in successfully.')
      navAfterCloseRef.current = location.state?.from?.pathname || '/'; setAuthOpen(false)
    } catch (err) { setLoginSubmitError(err?.message || 'Could not sign in.'); toast.error('Sign-in failed', err?.message || 'Please try again.') }
  }

  const onSignupSubmit = async (e) => {
    e.preventDefault()
    const v = validateSignup(signupForm); setSignupErrors(v); setSignupTouched({ name: true, email: true, password: true, confirmPassword: true })
    if (Object.keys(v).length > 0) return
    setSignupSubmitError(null)
    try {
      await signup({ name: signupForm.name.trim(), email: signupForm.email.trim().toLowerCase(), password: signupForm.password, phone: '' })
      toast.success('Account created', 'Welcome to ChargeFlow.')
      navAfterCloseRef.current = location.state?.from?.pathname || '/'; setAuthOpen(false)
    } catch (err) { setSignupSubmitError(err?.message || 'Could not create account.'); toast.error('Sign-up failed', err?.message || 'Please try again.') }
  }

  if (user) return <Navigate to={location.state?.from?.pathname || '/'} replace />

  const modalSpring = reduceMotion ? { duration: 0.2 } : { type: 'spring', damping: 27, stiffness: 340, mass: 0.82 }

  return (
    <LazyMotion features={domAnimation} strict>
      <div className="relative min-h-screen overflow-x-hidden bg-[#1B0C0C] text-white">
        <div className="pointer-events-none fixed inset-0 bg-gradient-to-b from-[#1B0C0C] via-[#252016] to-[#313E17]" aria-hidden />
        <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_35%,rgba(76,92,45,0.22)_0%,transparent_55%)]" aria-hidden />

        <LandingNavbar onOpenLogin={openLogin} onOpenSignup={openSignup} />
        <HeroSection onOpenLogin={openLogin} onScrollToNetwork={() => scrollToId('network')} />

        {/* Stats strip */}
        <div className="relative z-10 border-t border-white/[0.06] bg-[#1B0C0C]/80 px-4 pb-10 pt-4 backdrop-blur-sm sm:px-6">
          <div className="mx-auto grid max-w-5xl grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
            {[{ v: '2.4k+', l: 'Stations' }, { v: '9.1k+', l: 'Chargers' }, { v: '14k', l: 'Sessions/day' }, { v: '99.9%', l: 'Uptime' }].map((s, i) => (
              <m.div key={s.l}
                initial={reduceMotion ? false : { opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: reduceMotion ? 0 : 0.32 + i * 0.07, duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                className="rounded-2xl border border-white/[0.09] bg-white/[0.06] px-3 py-3.5 text-center shadow-[0_12px_40px_-8px_rgba(0,0,0,0.45)] backdrop-blur-md sm:px-4 sm:py-4"
              >
                <p className="text-xl font-bold tabular-nums text-white sm:text-2xl">{s.v}</p>
                <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-wider text-white/55 sm:text-[11px]">{s.l}</p>
              </m.div>
            ))}
          </div>
        </div>

        <LandingSections />

        {/* Auth Modal */}
        <AnimatePresence onExitComplete={handleExitComplete}>
          {authOpen && (
            <m.div key="auth-layer" className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: reduceMotion ? 0.12 : 0.22 }}>
              <button type="button" aria-label="Close" className="absolute inset-0 bg-[#1B0C0C]/82 backdrop-blur-sm" onClick={() => pulseClose(true)} />
              <m.div role="dialog" aria-modal="true"
                aria-labelledby={authMode === 'login' ? 'login-auth-title' : 'signup-auth-title'}
                className="relative z-10 w-full max-w-[420px] overflow-hidden rounded-2xl border border-white/[0.10] bg-[#221414]/90 shadow-[0_24px_80px_-20px_rgba(0,0,0,0.75)] backdrop-blur-xl"
                initial={reduceMotion ? false : { opacity: 0, scale: 0.93, y: 22 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.97, y: 12 }}
                transition={modalSpring} onClick={(e) => e.stopPropagation()}>
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#FFDE42]/30 to-transparent" />
                <button type="button" onClick={() => pulseClose(true)} className="absolute right-3 top-3 rounded-lg p-2 text-white/45 transition-colors hover:bg-white/10 hover:text-white" aria-label="Close dialog">
                  <X className="h-4 w-4" />
                </button>
                <div className="p-6 sm:p-8">
                  <AnimatePresence mode="wait" initial={false}>
                    {authMode === 'login' ? (
                      <m.div key="login" initial={reduceMotion ? false : { opacity: 0, x: -14 }} animate={{ opacity: 1, x: 0 }} exit={reduceMotion ? { opacity: 0 } : { opacity: 0, x: 10 }} transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}>
                        <h2 id="login-auth-title" className="pr-8 text-2xl font-bold text-white">Welcome back</h2>
                        <p className="mt-1 text-sm text-white/60">Sign in to continue.</p>
                        {loginSubmitError && (<div className="mt-5 flex items-start gap-2 rounded-xl border border-rose-500/35 bg-rose-500/10 px-3 py-2.5 text-xs text-rose-200"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /><span>{loginSubmitError}</span></div>)}
                        <form onSubmit={onLoginSubmit} className="mt-6 space-y-4" noValidate>
                          <AuthField label="Email" name="email" type="email" value={loginForm.email} onChange={(v) => setLoginField('email', v)} onBlur={() => { setLoginTouched((t) => ({ ...t, email: true })); setLoginErrors(validateLogin(loginForm)) }} error={loginTouched.email && loginErrors.email} autoComplete="email" />
                          <AuthField label="Password" name="password" type="password" value={loginForm.password} onChange={(v) => setLoginField('password', v)} onBlur={() => { setLoginTouched((t) => ({ ...t, password: true })); setLoginErrors(validateLogin(loginForm)) }} error={loginTouched.password && loginErrors.password} autoComplete="current-password"
                            rightLabel={<Link to="/forgot-password" className="text-xs font-medium text-[#FFDE42] hover:text-[#ffd000] hover:underline" onClick={() => pulseClose(true)}>Forgot password?</Link>} />
                          <m.div whileHover={reduceMotion ? undefined : { scale: 1.01 }} whileTap={reduceMotion ? undefined : glowTap}>
                            <Button type="submit" loading={loading} fullWidth size="lg" className="shadow-[0_0_28px_-10px_rgba(255,222,66,0.45)] transition-shadow hover:shadow-[0_0_36px_-8px_rgba(255,222,66,0.55)]" rightIcon={!loading && <ArrowRight className="h-4 w-4" />}>{loading ? 'Signing in…' : 'Sign in'}</Button>
                          </m.div>
                        </form>
                        <p className="mt-5 text-center text-xs text-white/40">Demo: <span className="text-white/65">sahib@chargeflow.dev</span> / <span className="text-white/65">demo1234</span></p>
                        <p className="mt-4 text-center text-sm text-white/60">New here?{' '}<button type="button" onClick={() => { setAuthMode('signup'); setLoginSubmitError(null) }} className="font-semibold text-[#FFDE42] hover:text-[#ffd000] hover:underline">Create an account</button></p>
                      </m.div>
                    ) : (
                      <m.div key="signup" initial={reduceMotion ? false : { opacity: 0, x: 14 }} animate={{ opacity: 1, x: 0 }} exit={reduceMotion ? { opacity: 0 } : { opacity: 0, x: -10 }} transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}>
                        <h2 id="signup-auth-title" className="pr-8 text-2xl font-bold text-white">Create account</h2>
                        <p className="mt-1 text-sm text-white/60">Join the network.</p>
                        {signupSubmitError && (<div className="mt-5 flex items-start gap-2 rounded-xl border border-rose-500/35 bg-rose-500/10 px-3 py-2.5 text-xs text-rose-200"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /><span>{signupSubmitError}</span></div>)}
                        <form onSubmit={onSignupSubmit} className="mt-6 space-y-3.5" noValidate>
                          <AuthField label="Full name" name="name" type="text" value={signupForm.name} onChange={(v) => setSignupField('name', v)} onBlur={() => { setSignupTouched((t) => ({ ...t, name: true })); setSignupErrors(validateSignup(signupForm)) }} error={signupTouched.name && signupErrors.name} autoComplete="name" />
                          <AuthField label="Email" name="email" type="email" value={signupForm.email} onChange={(v) => setSignupField('email', v)} onBlur={() => { setSignupTouched((t) => ({ ...t, email: true })); setSignupErrors(validateSignup(signupForm)) }} error={signupTouched.email && signupErrors.email} autoComplete="email" />
                          <AuthField label="Password" name="password" type="password" value={signupForm.password} onChange={(v) => setSignupField('password', v)} onBlur={() => { setSignupTouched((t) => ({ ...t, password: true })); setSignupErrors(validateSignup(signupForm)) }} error={signupTouched.password && signupErrors.password} autoComplete="new-password" />
                          <AuthField label="Confirm password" name="confirmPassword" type="password" value={signupForm.confirmPassword} onChange={(v) => setSignupField('confirmPassword', v)} onBlur={() => { setSignupTouched((t) => ({ ...t, confirmPassword: true })); setSignupErrors(validateSignup(signupForm)) }} error={signupTouched.confirmPassword && signupErrors.confirmPassword} autoComplete="new-password" />
                          <m.div whileHover={reduceMotion ? undefined : { scale: 1.01 }} whileTap={reduceMotion ? undefined : glowTap}>
                            <Button type="submit" loading={loading} fullWidth size="lg" className="shadow-[0_0_28px_-10px_rgba(255,222,66,0.45)] transition-shadow hover:shadow-[0_0_36px_-8px_rgba(255,222,66,0.55)]" rightIcon={!loading && <ArrowRight className="h-4 w-4" />}>{loading ? 'Creating…' : 'Create account'}</Button>
                          </m.div>
                        </form>
                        <p className="mt-5 text-center text-sm text-white/60">Already have an account?{' '}<button type="button" onClick={() => { setAuthMode('login'); setSignupSubmitError(null) }} className="font-semibold text-[#FFDE42] hover:text-[#ffd000] hover:underline">Sign in</button></p>
                      </m.div>
                    )}
                  </AnimatePresence>
                </div>
              </m.div>
            </m.div>
          )}
        </AnimatePresence>
      </div>
    </LazyMotion>
  )
}
