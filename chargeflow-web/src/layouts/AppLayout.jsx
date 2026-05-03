import { useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Sidebar from '../components/layout/Sidebar.jsx'
import Navbar from '../components/layout/Navbar.jsx'

export default function AppLayout() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const { pathname } = useLocation()
  const isMapDashboard = pathname === '/'

  return (
    <div className="flex h-screen min-h-0 bg-transparent text-white no-tap-highlight">
      <Sidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <div className="z-30 shrink-0 px-4 pb-0 pt-4 sm:px-6">
          <Navbar onMenuClick={() => setMobileOpen((s) => !s)} />
        </div>
        <main
          className={`flex min-h-0 flex-1 flex-col px-4 pb-4 pt-4 sm:px-6 sm:pb-6 sm:pt-5 ${
            isMapDashboard ? 'overflow-hidden' : 'overflow-y-auto'
          }`}
        >
          <Outlet />
        </main>
      </div>
    </div>
  )
}
