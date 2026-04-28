import { request } from './client.js'
import { normalizeError } from './errors.js'
import { mockBookings } from '../utils/mockData.js'

const USE_MOCK = true
const delay = (ms) => new Promise((r) => setTimeout(r, ms))

// In-memory mock store so creating/cancelling persists during the session.
let bookingsStore = [...mockBookings]

const ACTIVE = ['CONFIRMED', 'PENDING', 'IN_PROGRESS']

export const bookingApi = {
  async list() {
    try {
      if (USE_MOCK) {
        await delay(250)
        return [...bookingsStore].sort(
          (a, b) => new Date(b.startTime) - new Date(a.startTime),
        )
      }
      return await request('get', '/bookings/my')
    } catch (err) {
      throw normalizeError(err)
    }
  },

  /**
   * Active/upcoming bookings on a single charger — used by the smart booking
   * flow to grey-out conflicting time slots and surface "next available".
   */
  async forCharger(chargerId) {
    try {
      if (USE_MOCK) {
        await delay(150)
        const now = Date.now()
        return bookingsStore.filter(
          (b) =>
            b.chargerId === chargerId &&
            ACTIVE.includes(b.status) &&
            new Date(b.endTime).getTime() > now,
        )
      }
      // Production: backend should expose this; falls back to /my filter.
      const all = await request('get', '/bookings/my')
      const now = Date.now()
      return (all || []).filter(
        (b) =>
          (b.charger?.id === chargerId || b.charger === chargerId || b.chargerId === chargerId) &&
          ACTIVE.includes(b.status) &&
          new Date(b.endTime).getTime() > now,
      )
    } catch (err) {
      throw normalizeError(err)
    }
  },

  async create(payload) {
    try {
      if (USE_MOCK) {
        await delay(500)
        if (!payload?.chargerId || !payload?.startTime) {
          throw Object.assign(new Error('Missing required fields'), {
            response: {
              status: 400,
              data: { error: { code: 'VALIDATION', message: 'Missing required fields' } },
            },
          })
        }
        // Mirror backend conflict detection so the UI behaves identically in mock mode.
        const newStart = new Date(payload.startTime).getTime()
        const newEnd = new Date(payload.endTime).getTime()
        const conflict = bookingsStore.find(
          (b) =>
            b.chargerId === payload.chargerId &&
            ACTIVE.includes(b.status) &&
            new Date(b.startTime).getTime() < newEnd &&
            new Date(b.endTime).getTime() > newStart,
        )
        if (conflict) {
          throw Object.assign(new Error('Time slot conflicts with an existing booking.'), {
            response: {
              status: 409,
              data: {
                error: {
                  code: 'BOOKING_CONFLICT',
                  message: 'This charger already has a booking that overlaps your time.',
                  details: { conflictingBookingId: conflict.id },
                },
              },
            },
          })
        }
        const booking = {
          id: `b_${Date.now()}`,
          status: 'CONFIRMED',
          paymentStatus: 'UNPAID',
          createdAt: new Date().toISOString(),
          ...payload,
        }
        bookingsStore = [booking, ...bookingsStore]
        return booking
      }
      return await request('post', '/bookings', { data: payload })
    } catch (err) {
      throw normalizeError(err)
    }
  },

  async cancel(id) {
    try {
      if (USE_MOCK) {
        await delay(220)
        bookingsStore = bookingsStore.map((b) =>
          b.id === id ? { ...b, status: 'CANCELLED' } : b,
        )
        return bookingsStore.find((b) => b.id === id)
      }
      return await request('delete', `/bookings/${id}`)
    } catch (err) {
      throw normalizeError(err)
    }
  },
}


