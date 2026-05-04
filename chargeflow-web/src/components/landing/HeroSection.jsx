import { m, useReducedMotion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'

const HERO_CAR_SRC = '/hero-ev.png'

const STATS = [
  { value: '2.4k+', label: 'Stations' },
  { value: '9.1k+', label: 'Chargers' },
  { value: '14k', label: 'Sessions/day' },
  { value: '99.9%', label: 'Uptime' },
]

const staggerContainer = {
  hidden: {},
  show: { transition: { staggerChildren: 0.09, delayChildren: 0.06 } },
}

const fadeUp = {
  hidden: { opacity: 0, y: 22 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease: [0.16, 1, 0.3, 1] },
  },
}

export default function HeroSection({ onOpenLogin, onScrollToNetwork }) {
  const reduceMotion = useReducedMotion()

  return (
    <section className="relative z-10 flex min-h-[100dvh] flex-col overflow-x-clip px-4 pb-12 pt-24 sm:pt-28">
      {/* Soft ambient glow — very subtle, behind car */}
      <div
        className="pointer-events-none absolute left-1/2 top-[55%] z-[1] h-[min(80vw,600px)] w-[min(100vw,900px)] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-40 blur-3xl"
        style={{
          background: 'radial-gradient(ellipse 50% 45% at 50% 50%, rgba(255,222,66,0.08) 0%, transparent 70%)',
        }}
        aria-hidden
      />

      {/* Hero copy — centered above car */}
      <m.div
        className="relative z-[25] mx-auto flex w-full max-w-4xl flex-col items-center text-center"
        variants={staggerContainer}
        initial={reduceMotion ? false : 'hidden'}
        animate="show"
      >
        <m.p
          variants={fadeUp}
          className="text-[11px] font-semibold uppercase tracking-[0.4em] text-[#FFDE42]/85 md:text-xs"
        >
          Premium EV infrastructure
        </m.p>
        <m.h1
          variants={fadeUp}
          className="mt-4 max-w-[18ch] text-4xl font-semibold leading-[1.05] tracking-tight md:mt-5 md:text-5xl lg:text-[3.5rem]"
        >
          Power without compromise.
        </m.h1>
        <m.p variants={fadeUp} className="mt-4 max-w-md text-base text-white/65 md:mt-5 md:text-lg">
          The cinematic control plane for charging networks — real-time, resilient, unmistakably premium.
        </m.p>
        <m.div variants={fadeUp} className="mt-7 flex flex-wrap items-center justify-center gap-4 md:mt-8">
          <button
            type="button"
            onClick={onScrollToNetwork}
            className="group inline-flex items-center gap-2 rounded-2xl bg-[#FFDE42] px-8 py-3.5 text-sm font-bold text-[#1B0C0C] shadow-[0_12px_40px_-12px_rgba(255,222,66,0.55)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_16px_48px_-10px_rgba(255,222,66,0.65)]"
          >
            Explore the network
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </button>
          <button
            type="button"
            onClick={onOpenLogin}
            className="text-sm font-medium text-white/55 underline-offset-4 transition-colors hover:text-white hover:underline"
          >
            Member access
          </button>
        </m.div>
      </m.div>

      {/* Car — centered below text */}
      <m.div
        className="relative z-[15] flex w-full flex-1 flex-col items-center justify-end pb-1 mt-10 sm:mt-16"
        initial={reduceMotion ? false : { opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0, transition: { duration: 0.85, delay: 0.1, ease: [0.16, 1, 0.3, 1] } }}
      >
        {/* Background watermark text */}
          <span
            className="pointer-events-none absolute left-1/2 top-1/2 z-[0] -translate-x-1/2 -translate-y-1/2 select-none whitespace-nowrap font-black uppercase leading-none text-white/[0.22]"
            style={{ fontSize: 'clamp(5rem, 16vw, 13rem)', letterSpacing: '-0.03em' }}
            aria-hidden
          >
            CHARGEFLOW
          </span>

        <m.div
          className="relative mx-auto w-full max-w-[min(92vw,860px)] translate-y-6 lg:max-w-[900px]"
          animate={
            reduceMotion
              ? false
              : { y: [0, -6, 0], transition: { duration: 8, repeat: Infinity, ease: 'easeInOut', delay: 1.05 } }
          }
        >
          {/* Subtle ground reflection glow */}
          <div
            className="pointer-events-none absolute inset-x-[10%] bottom-[6%] top-[45%] rounded-[100%] bg-gradient-to-t from-[#FFDE42]/[0.04] via-[#4C5C2D]/[0.03] to-transparent blur-3xl"
            aria-hidden
          />

          <img
            src={HERO_CAR_SRC}
            alt="ChargeFlow electric vehicle"
            className="pointer-events-none relative z-10 mx-auto block h-auto w-full max-h-[40vh] sm:max-h-[45vh] md:max-h-[50vh] lg:max-h-[520px] select-none object-contain object-bottom"
            style={{
              filter: 'drop-shadow(0 14px 28px rgba(0,0,0,0.42)) drop-shadow(0 4px 12px rgba(0,0,0,0.28))',
            }}
            loading="eager"
            decoding="async"
            fetchPriority="high"
          />

          {/* Floor shadow */}
          <div
            className="pointer-events-none absolute -bottom-1 left-1/2 z-[11] h-12 w-[60%] max-w-[480px] -translate-x-1/2 rounded-[100%] bg-black/60 blur-[28px]"
            aria-hidden
          />
        </m.div>
      </m.div>

      {/* Scroll hint */}
      <div className="pointer-events-none absolute bottom-3 left-1/2 z-40 flex -translate-x-1/2 justify-center px-4 sm:bottom-4">
        <m.button
          type="button"
          onClick={onScrollToNetwork}
          className="pointer-events-auto text-[11px] font-medium uppercase tracking-[0.28em] text-white/45 transition-colors hover:text-white/70"
          initial={reduceMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1, transition: { delay: 1.1, duration: 0.55 } }}
        >
          <span className="inline-flex items-center gap-1.5">
            <span aria-hidden className="text-sm leading-none">↓</span>
            Scroll to explore
          </span>
        </m.button>
      </div>
    </section>
  )
}
