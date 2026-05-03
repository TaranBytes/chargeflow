import { Link } from 'react-router-dom'

function scrollToId(id) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

export default function LandingSections() {
  return (
    <>
      <section
        id="network"
        className="relative z-10 border-t border-white/[0.06] scroll-mt-20 px-5 py-24 sm:px-8"
      >
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#FFDE42]/80">
            Network
          </p>
          <h2 className="mt-4 text-2xl font-semibold text-white sm:text-3xl">
            Every station, one live graph.
          </h2>
          <p className="mt-4 text-white/55 leading-relaxed">
            Operators see availability, sessions, and health in real time — the same surface your
            drivers trust.
          </p>
        </div>
      </section>

      <section
        id="pricing"
        className="relative z-10 border-t border-white/[0.06] scroll-mt-20 px-5 py-24 sm:px-8"
      >
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#FFDE42]/80">
            Pricing
          </p>
          <h2 className="mt-4 text-2xl font-semibold text-white sm:text-3xl">
            Volume that scales with your fleet.
          </h2>
          <p className="mt-4 text-white/55 leading-relaxed">
            Transparent per-session economics, negotiated bulk rates, and enterprise SLAs — speak
            with our team when you are ready to move.
          </p>
        </div>
      </section>

      <section
        id="features"
        className="relative z-10 border-t border-white/[0.06] scroll-mt-20 px-5 py-24 sm:px-8"
      >
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#FFDE42]/80">
            Features
          </p>
          <h2 className="mt-4 text-2xl font-semibold text-white sm:text-3xl">
            Built for operators who refuse downtime.
          </h2>
          <ul className="mx-auto mt-10 max-w-lg space-y-4 text-left text-white/60">
            {[
              'Sub-second availability across the map',
              'Booking & session orchestration out of the box',
              'Audit trails, roles, and fleet-grade security',
            ].map((item) => (
              <li key={item} className="flex gap-3 border-b border-white/[0.06] pb-4">
                <span className="mt-0.5 text-[#FFDE42]/70">◆</span>
                {item}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section
        id="about"
        className="relative z-10 border-t border-white/[0.06] scroll-mt-20 px-5 py-24 sm:px-8"
      >
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#FFDE42]/80">
            About
          </p>
          <h2 className="mt-4 text-2xl font-semibold text-white sm:text-3xl">ChargeFlow</h2>
          <p className="mt-4 text-white/55 leading-relaxed">
            We are building the definitive software layer for electric mobility — obsessive about
            craft, latency, and the moment a driver plugs in.
          </p>
        </div>
      </section>

      <footer className="relative z-10 border-t border-white/[0.06] px-5 py-8 text-center text-xs text-white/40 sm:px-8">
        © {new Date().getFullYear()} ChargeFlow Inc. ·{' '}
        <Link
          to="/forgot-password"
          className="text-[#FFDE42]/70 transition-colors hover:text-[#FFDE42]"
        >
          Forgot password
        </Link>
      </footer>
    </>
  )
}
