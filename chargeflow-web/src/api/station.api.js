import { request } from './client.js'
import { normalizeError } from './errors.js'
import { mockStations } from '../utils/mockData.js'

// Toggle this to false once the backend is connected.
const USE_MOCK = false
const delay = (ms) => new Promise((r) => setTimeout(r, ms))

export const stationApi = {
  async list() {
    try {
      if (USE_MOCK) {
        await delay(400)
        return mockStations
      }
      return await request('get', '/stations')
    } catch (err) {
      throw normalizeError(err)
    }
  },

  async nearby({ lat, lng, radius = 5 }) {
    try {
      if (USE_MOCK) {
        await delay(300)
        return mockStations
      }
      return await request('get', '/stations/nearby', { params: { lat, lng, radius } })
    } catch (err) {
      throw normalizeError(err)
    }
  },

  async getById(id) {
    try {
      if (USE_MOCK) {
        await delay(250)
        const s = mockStations.find((x) => x.id === id)
        if (!s) throw Object.assign(new Error('Station not found'), { response: { status: 404, data: { error: { code: 'NOT_FOUND', message: 'Station not found' } } } })
        return s
      }
      return await request('get', `/stations/${id}`)
    } catch (err) {
      throw normalizeError(err)
    }
  },
}
