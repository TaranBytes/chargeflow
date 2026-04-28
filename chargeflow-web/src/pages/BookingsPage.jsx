import { useEffect, useState, useCallback } from 'react'
import BookingCard from '../components/booking/BookingCard.jsx'
import { bookingApi } from '../api/booking.api.js'
import { useNavigate } from 'react-router-dom'
import { CalendarOff } from 'lucide-react'
import EmptyState from '../components/common/EmptyState.jsx'
import ErrorState from '../components/common/ErrorState.jsx'
import { Skeleton } from '../components/common/Skeleton.jsx'
import Button from '../components/common/Button.jsx'
import { useToast } from '../hooks/useToast.js'

export default function BookingsPage() {
  const navigate = useNavigate()
  const toast = useToast()
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [tab, setTab] = useState('upcoming')
  const [cancellingId, setCancellingId] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const r = await bookingApi.list()
      setBookings(r)
    } catch (err) {
      setError(err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const upcoming = bookings.filter((b) =>
    ['CONFIRMED', 'PENDING', 'IN_PROGRESS'].includes(b.status),
  )
  const past = bookings.filter((b) =>
    ['COMPLETED', 'CANCELLED', 'EXPIRED'].includes(b.status),
  )
  const list = tab === 'upcoming' ? upcoming : past

  const handleCancel = async (booking) => {
    setCancellingId(booking.id)
    try {
      await bookingApi.cancel(booking.id)
      toast.success('Booking cancelled', `${booking.chargerName} has been freed up.`)
      await load()
    } catch (err) {
      toast.error('Could not cancel', err?.message || 'Please try again.')
    } finally {
      setCancellingId(null)
    }
  }

  return (
    <div className="p-4 lg:p-6 space-y-5 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">My Bookings</h1>
        <p className="text-sm text-slate-500 mt-1">
          Manage your upcoming and past charging reservations.
        </p>
      </div>

      <div className="inline-flex bg-slate-100 p-1 rounded-lg">
        {[
          { id: 'upcoming', label: `Upcoming (${upcoming.length})` },
          { id: 'past', label: `History (${past.length})` },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-1.5 text-sm font-medium rounded-md transition ${
              tab === t.id ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading && (
        <div className="space-y-3">
          <Skeleton className="h-32 rounded-xl" />
          <Skeleton className="h-32 rounded-xl" />
          <Skeleton className="h-32 rounded-xl" />
        </div>
      )}

      {error && !loading && (
        <ErrorState
          title="Couldn't load bookings"
          message={error.message}
          onRetry={load}
        />
      )}

      {!loading && !error && list.length === 0 && (
        <EmptyState
          icon={CalendarOff}
          title={tab === 'upcoming' ? 'No upcoming bookings' : 'No past bookings'}
          description={
            tab === 'upcoming'
              ? 'Reserve a charger from the map to see it here.'
              : 'Your charging history will appear here once you have completed sessions.'
          }
          action={
            tab === 'upcoming' ? (
              <Button onClick={() => navigate('/')}>Find a charger</Button>
            ) : null
          }
        />
      )}

      {!loading && !error && list.length > 0 && (
        <div className="space-y-3">
          {list.map((b) => (
            <BookingCard
              key={b.id}
              booking={b}
              onCancel={cancellingId === b.id ? undefined : handleCancel}
            />
          ))}
        </div>
      )}
    </div>
  )
}
