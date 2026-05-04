import * as authService from '../services/auth.service.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { ApiError } from '../utils/ApiError.js'
import { Station } from '../models/Station.model.js'
import { Charger } from '../models/Charger.model.js'
import { ChargingSession } from '../models/Session.model.js'
import { User } from '../models/User.model.js'
import { Alert } from '../models/Alert.model.js'

const STATION_STATUS_TO_DB = {
  active: 'ACTIVE',
  maintenance: 'MAINTENANCE',
  offline: 'INACTIVE',
}
const STATION_STATUS_FROM_DB = {
  ACTIVE: 'active',
  MAINTENANCE: 'maintenance',
  INACTIVE: 'offline',
}
const CHARGER_STATUS_TO_DB = {
  available: 'AVAILABLE',
  charging: 'OCCUPIED',
  faulty: 'FAULTED',
}
const CHARGER_STATUS_FROM_DB = {
  AVAILABLE: 'available',
  RESERVED: 'charging',
  OCCUPIED: 'charging',
  OFFLINE: 'faulty',
  FAULTED: 'faulty',
}

const mapStation = (s) => ({
  ...s.toJSON(),
  status: STATION_STATUS_FROM_DB[s.status] || 'offline',
})

const mapCharger = (c) => ({
  ...c.toJSON(),
  status: CHARGER_STATUS_FROM_DB[c.status] || 'faulty',
})

export const adminLogin = asyncHandler(async (req, res) => {
  const result = await authService.login(req.body)
  if (result.user.role !== 'admin') throw ApiError.forbidden('Admin access only')
  res.json({ success: true, data: result })
})

export const listStations = asyncHandler(async (req, res) => {
  const { q, status } = req.query
  const query = {}
  if (q) query.name = { $regex: q, $options: 'i' }
  if (status && STATION_STATUS_TO_DB[status]) query.status = STATION_STATUS_TO_DB[status]

  const stations = await Station.find(query).sort({ createdAt: -1 })
  res.json({ success: true, data: stations.map(mapStation) })
})

export const createStation = asyncHandler(async (req, res) => {
  const station = await Station.create({
    name: req.body.name,
    address: { line1: req.body.address },
    location: {
      type: 'Point',
      coordinates: [req.body.lng, req.body.lat],
    },
    pricingPerKWh: req.body.pricingPerKWh,
    status: STATION_STATUS_TO_DB[req.body.status] || 'ACTIVE',
    operator: req.user.id,
  })
  res.status(201).json({ success: true, data: mapStation(station) })
})

export const updateStation = asyncHandler(async (req, res) => {
  const station = await Station.findById(req.params.id)
  if (!station) throw ApiError.notFound('Station not found')

  station.name = req.body.name ?? station.name
  station.address = { ...(station.address || {}), line1: req.body.address ?? station.address?.line1 }
  if (req.body.lat !== undefined && req.body.lng !== undefined) {
    station.location = { type: 'Point', coordinates: [req.body.lng, req.body.lat] }
  }
  if (req.body.pricingPerKWh !== undefined) station.pricingPerKWh = req.body.pricingPerKWh
  if (req.body.status && STATION_STATUS_TO_DB[req.body.status]) {
    station.status = STATION_STATUS_TO_DB[req.body.status]
  }
  await station.save()

  res.json({ success: true, data: mapStation(station) })
})

export const deleteStation = asyncHandler(async (req, res) => {
  const station = await Station.findById(req.params.id)
  if (!station) throw ApiError.notFound('Station not found')
  await Charger.deleteMany({ station: station._id })
  await station.deleteOne()
  res.json({ success: true, data: { id: req.params.id } })
})

export const listChargers = asyncHandler(async (req, res) => {
  const { stationId } = req.query
  const query = stationId ? { station: stationId } : {}
  const chargers = await Charger.find(query).populate('station', 'name').sort({ createdAt: -1 })
  res.json({ success: true, data: chargers.map(mapCharger) })
})

export const updateCharger = asyncHandler(async (req, res) => {
  const charger = await Charger.findById(req.params.id)
  if (!charger) throw ApiError.notFound('Charger not found')
  if (req.body.power !== undefined) charger.powerKW = req.body.power
  if (req.body.type !== undefined) charger.type = req.body.type
  if (req.body.status && CHARGER_STATUS_TO_DB[req.body.status]) {
    charger.status = CHARGER_STATUS_TO_DB[req.body.status]
  }
  if (req.body.isEnabled !== undefined) charger.isEnabled = req.body.isEnabled
  await charger.save()
  await charger.populate('station', 'name')
  res.json({ success: true, data: mapCharger(charger) })
})

export const toggleCharger = asyncHandler(async (req, res) => {
  const charger = await Charger.findById(req.params.id)
  if (!charger) throw ApiError.notFound('Charger not found')
  charger.isEnabled = !charger.isEnabled
  await charger.save()
  res.json({ success: true, data: mapCharger(charger) })
})

export const listSessions = asyncHandler(async (req, res) => {
  const sessions = await ChargingSession.find()
    .populate('user', 'name email')
    .populate('station', 'name')
    .populate('charger', 'ocppId type')
    .sort({ startTime: -1 })
    .limit(300)
  res.json({ success: true, data: sessions.map((s) => s.toJSON()) })
})

export const listActiveSessions = asyncHandler(async (_req, res) => {
  const sessions = await ChargingSession.find({ status: 'ACTIVE' })
    .populate('user', 'name email')
    .populate('station', 'name')
    .populate('charger', 'ocppId type')
    .sort({ startTime: -1 })
  res.json({ success: true, data: sessions.map((s) => s.toJSON()) })
})

export const listUsers = asyncHandler(async (_req, res) => {
  const users = await User.find().select('name email role isBlocked createdAt').sort({ createdAt: -1 })
  res.json({ success: true, data: users.map((u) => u.toJSON()) })
})

export const toggleUserBlock = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id)
  if (!user) throw ApiError.notFound('User not found')
  if (user.role === 'admin') throw ApiError.forbidden('Cannot block admin users')
  user.isBlocked = req.body.blocked ?? !user.isBlocked
  await user.save()
  res.json({ success: true, data: user.toJSON() })
})

export const revenueSummary = asyncHandler(async (_req, res) => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const [totals] = await ChargingSession.aggregate([
    { $match: { status: 'COMPLETED' } },
    {
      $group: {
        _id: null,
        totalRevenue: { $sum: '$cost' },
        totalEnergy: { $sum: '$energyConsumed' },
      },
    },
  ])
  const [todayAgg] = await ChargingSession.aggregate([
    { $match: { status: 'COMPLETED', endTime: { $gte: today } } },
    { $group: { _id: null, revenueToday: { $sum: '$cost' }, sessionsToday: { $sum: 1 } } },
  ])
  const byStation = await ChargingSession.aggregate([
    { $match: { status: 'COMPLETED' } },
    { $group: { _id: '$station', revenue: { $sum: '$cost' }, sessions: { $sum: 1 } } },
    { $sort: { revenue: -1 } },
    { $limit: 10 },
    { $lookup: { from: 'stations', localField: '_id', foreignField: '_id', as: 'station' } },
    { $unwind: { path: '$station', preserveNullAndEmptyArrays: true } },
    { $project: { _id: 0, stationId: '$_id', stationName: '$station.name', revenue: 1, sessions: 1 } },
  ])
  res.json({
    success: true,
    data: {
      totalRevenue: totals?.totalRevenue || 0,
      totalEnergy: totals?.totalEnergy || 0,
      revenueToday: todayAgg?.revenueToday || 0,
      sessionsToday: todayAgg?.sessionsToday || 0,
      revenueByStation: byStation,
    },
  })
})

export const revenueTimeseries = asyncHandler(async (req, res) => {
  const days = Number(req.query.days || 7)
  const start = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
  const series = await ChargingSession.aggregate([
    { $match: { status: 'COMPLETED', endTime: { $gte: start } } },
    {
      $group: {
        _id: {
          year: { $year: '$endTime' },
          month: { $month: '$endTime' },
          day: { $dayOfMonth: '$endTime' },
        },
        revenue: { $sum: '$cost' },
        sessions: { $sum: 1 },
      },
    },
    { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } },
  ])
  const data = series.map((item) => ({
    date: `${item._id.year}-${String(item._id.month).padStart(2, '0')}-${String(item._id.day).padStart(2, '0')}`,
    revenue: item.revenue,
    sessions: item.sessions,
  }))
  res.json({ success: true, data })
})

export const listAlerts = asyncHandler(async (_req, res) => {
  const [dbAlerts, faultyChargers, offlineStations] = await Promise.all([
    Alert.find().sort({ createdAt: -1 }).limit(50).populate('stationId', 'name').populate('chargerId', 'ocppId'),
    Charger.find({ status: { $in: ['FAULTED', 'OFFLINE'] } }).populate('station', 'name').limit(50),
    Station.find({ status: 'INACTIVE' }).limit(50),
  ])

  const generatedAlerts = [
    ...faultyChargers.map((charger) => ({
      id: `fault-${charger.id}`,
      type: 'charger_fault',
      message: `Charger ${charger.ocppId} is ${charger.status.toLowerCase()}`,
      stationId: charger.station?.id || null,
      chargerId: charger.id,
      severity: 'high',
      createdAt: charger.updatedAt,
    })),
    ...offlineStations.map((station) => ({
      id: `station-offline-${station.id}`,
      type: 'station_offline',
      message: `Station ${station.name} is offline`,
      stationId: station.id,
      chargerId: null,
      severity: 'critical',
      createdAt: station.updatedAt,
    })),
  ]

  const persisted = dbAlerts.map((a) => a.toJSON())
  const data = [...persisted, ...generatedAlerts]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 100)
  res.json({ success: true, data })
})
