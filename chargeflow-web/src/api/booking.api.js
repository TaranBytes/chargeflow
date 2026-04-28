import { request } from './client.js'
import { normalizeError } from './errors.js'
import { mockBookings } from '../utils/mockData.js'

const USE_MOCK = true
const delay = (ms) => new Promise((r) => setTimeout(r, ms))

// In-memory mock store so creating/cancelling persists during the session.
let bookingsStore = [...mockBookings]

export const bookingApi = {
  async list() {
    try {
      if (USE_MOCK) {
        await delay(300)
        return [...bookingsStore].sort(
          (a, b) => new Date(b.startTime) - new Date(a.startTime),
        )
      }
      return await request('get', '/bookings')
    } catch (err) {
      throw normalizeError(err)
    }
  },

  async create(payload) {
    try {
      if (USE_MOCK) {
        await delay(600)
        // Tiny client-side guard so the mock surfaces 'validation' errors too.
        if (!payload?.chargerId || !payload?.startTime) {
          throw Object.assign(new Error('Missing required fields'), {
            response: {
              status: 400,
              data: { error: { code: 'VALIDATION', message: 'Missing required fields' } },
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
        await delay(250)
        bookingsStore = bookingsStore.map((b) =>
          b.id === id ? { ...b, status: 'CANCELLED' } : b,
        )
        return bookingsStore.find((b) => b.id === id)
      }
      return await request('patch', `/bookings/${id}/cancel`)
    } catch (err) {
      throw normalizeError(err)
    }
  },
}
