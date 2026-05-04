import { request } from './client.js'

export const adminApi = {
  dashboard: async () => {
    const [stations, chargers, activeSessions, revenueSummary, revenueTimeseries, alerts] =
      await Promise.all([
        request('get', '/admin/stations'),
        request('get', '/admin/chargers'),
        request('get', '/admin/sessions/active'),
        request('get', '/admin/revenue/summary'),
        request('get', '/admin/revenue/timeseries', { params: { days: 7 } }),
        request('get', '/admin/alerts'),
      ])
    return { stations, chargers, activeSessions, revenueSummary, revenueTimeseries, alerts }
  },
  listStations: (params) => request('get', '/admin/stations', { params }),
  createStation: (data) => request('post', '/admin/stations', { data }),
  updateStation: (id, data) => request('put', `/admin/stations/${id}`, { data }),
  deleteStation: (id) => request('delete', `/admin/stations/${id}`),
  listChargers: (params) => request('get', '/admin/chargers', { params }),
  updateCharger: (id, data) => request('put', `/admin/chargers/${id}`, { data }),
  toggleCharger: (id) => request('patch', `/admin/chargers/${id}/toggle`),
  listSessions: () => request('get', '/admin/sessions'),
  listActiveSessions: () => request('get', '/admin/sessions/active'),
  listUsers: () => request('get', '/admin/users'),
  toggleUserBlock: (id, blocked) => request('patch', `/admin/users/${id}/block`, { data: { blocked } }),
  revenueSummary: () => request('get', '/admin/revenue/summary'),
  revenueTimeseries: (days = 7) => request('get', '/admin/revenue/timeseries', { params: { days } }),
  listAlerts: () => request('get', '/admin/alerts'),
}
