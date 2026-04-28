import { asyncHandler } from '../utils/asyncHandler.js'
import { ApiError } from '../utils/ApiError.js'
import { Station } from '../models/Station.model.js'
import { Charger } from '../models/Charger.model.js'

export const listStations = asyncHandler(async (req, res) => {
  const { search, city, page = 1, limit = 50 } = req.query
  const filter = { status: 'ACTIVE' }
  if (search) filter.$or = [
    { name: new RegExp(String(search), 'i') },
    { 'address.city': new RegExp(String(search), 'i') },
  ]
  if (city) filter['address.city'] = new RegExp(`^${city}$`, 'i')

  const skip = (Number(page) - 1) * Number(limit)
  const [items, total] = await Promise.all([
    Station.find(filter).skip(skip).limit(Number(limit)).lean({ virtuals: true }),
    Station.countDocuments(filter),
  ])

  // Attach a small charger summary so the map list renders without a 2nd round-trip.
  const ids = items.map((s) => s._id)
  const chargers = await Charger.find({ station: { $in: ids } }).lean({ virtuals: true })
  const grouped = chargers.reduce((acc, c) => {
    const k = c.station.toString()
    ;(acc[k] = acc[k] || []).push(c)
    return acc
  }, {})

  const data = items.map((s) => ({
    ...stationOut(s),
    chargers: (grouped[s._id.toString()] || []).map(chargerOut),
  }))

  res.json({ success: true, data, total, page: Number(page) })
})

export const getStation = asyncHandler(async (req, res) => {
  const station = await Station.findById(req.params.id)
  if (!station) throw ApiError.notFound('Station not found')
  const chargers = await Charger.find({ station: station._id })

  res.json({
    success: true,
    data: {
      ...station.toJSON(),
      chargers: chargers.map((c) => c.toJSON()),
    },
  })
})

export const listChargersForStation = asyncHandler(async (req, res) => {
  const station = await Station.findById(req.params.id).select('_id')
  if (!station) throw ApiError.notFound('Station not found')
  const chargers = await Charger.find({ station: station._id })
  res.json({ success: true, data: chargers.map((c) => c.toJSON()) })
})

// ── helpers (lean docs don't run schema toJSON, so we transform manually) ───
function stationOut(s) {
  const out = { ...s, id: s._id }
  if (s.location?.coordinates?.length === 2) {
    out.location = { lat: s.location.coordinates[1], lng: s.location.coordinates[0] }
  }
  delete out._id
  delete out.__v
  return out
}

function chargerOut(c) {
  const out = { ...c, id: c._id }
  delete out._id
  delete out.__v
  return out
}
