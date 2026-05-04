import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import csv from 'csv-parser'
import mongoose from 'mongoose'
import { connectDB, disconnectDB } from '../src/config/db.js'
import { Station } from '../src/models/Station.model.js'
import { Charger } from '../src/models/Charger.model.js'
import { logger } from '../src/utils/logger.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const argv = process.argv.slice(2)
const getArg = (name, fallback) => {
  const key = `--${name}=`
  const hit = argv.find((a) => a.startsWith(key))
  return hit ? hit.slice(key.length) : fallback
}

const csvPath = path.resolve(__dirname, '..', getArg('file', '../ev-charging-stations-india.csv'))
const LIMIT = Number(getArg('limit', '0'))

const stationStatusMap = {
  active: 'ACTIVE',
  maintenance: 'MAINTENANCE',
  offline: 'INACTIVE',
  inactive: 'INACTIVE',
}

const chargerStatuses = ['AVAILABLE', 'AVAILABLE', 'AVAILABLE', 'RESERVED', 'OCCUPIED']

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function inferChargerType(name = '') {
  const n = name.toLowerCase()
  if (n.includes('dc') || n.includes('fast')) return 'DC'
  if (n.includes('ac')) return 'AC'
  return Math.random() > 0.5 ? 'AC' : 'DC'
}

function inferConnector(type) {
  if (type === 'DC') return Math.random() > 0.5 ? 'CCS' : 'CHAdeMO'
  return 'Type2'
}

function inferPowerKW(type) {
  if (type === 'DC') return [60, 90, 120, 150][randomInt(0, 3)]
  return [7, 11, 22][randomInt(0, 2)]
}

function stationKey(name, lat, lng) {
  return `${String(name || '')
    .trim()
    .toLowerCase()}|${Number(lat).toFixed(5)}|${Number(lng).toFixed(5)}`
}

function isValidCoordinate(lat, lng) {
  return Number.isFinite(lat) && Number.isFinite(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180
}

function parseCsv(filePath) {
  return new Promise((resolve, reject) => {
    const rows = []
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (row) => rows.push(row))
      .on('end', () => resolve(rows))
      .on('error', reject)
  })
}

async function run() {
  logger.info(`[csv-import] reading ${csvPath}`)
  const rawRows = await parseCsv(csvPath)
  const rows = LIMIT > 0 ? rawRows.slice(0, LIMIT) : rawRows
  logger.info(`[csv-import] parsed rows=${rows.length}`)

  await connectDB()

  const existingStations = await Station.find({}).select('name location.coordinates').lean()
  const existingKeys = new Set(
    existingStations.map((s) => stationKey(s.name, s.location?.coordinates?.[1], s.location?.coordinates?.[0])),
  )

  const toInsert = []
  const parseErrors = []
  const seenInCsv = new Set()
  const validCsvRows = []

  for (const [idx, row] of rows.entries()) {
    const line = idx + 2
    const name = String(row.name || '').trim()
    const addressLine = String(row.address || '').trim()
    const city = String(row.city || '').trim() || 'Unknown'
    const state = String(row.state || '').trim() || 'Unknown'
    const lat = Number(row.lat ?? row.lattitude)
    const lng = Number(row.lng ?? row.longitude)

    const pricingInput = row.pricing ?? row.price ?? row.type
    const pricingPerKWh = Number(pricingInput)
    const statusRaw = String(row.status || 'active').trim().toLowerCase()
    const status = stationStatusMap[statusRaw] || 'ACTIVE'

    if (!name || !addressLine || !isValidCoordinate(lat, lng)) {
      parseErrors.push({ line, reason: 'invalid required fields' })
      continue
    }

    const key = stationKey(name, lat, lng)
    validCsvRows.push({ key, name, lat, lng })
    if (seenInCsv.has(key) || existingKeys.has(key)) continue
    seenInCsv.add(key)

    toInsert.push({
      name,
      address: { line1: addressLine, city, state, country: 'India' },
      location: { type: 'Point', coordinates: [lng, lat] },
      pricingPerKWh: Number.isFinite(pricingPerKWh) && pricingPerKWh > 0 ? pricingPerKWh : 12,
      status,
      operatingHours: '24/7',
      amenities: [],
      totalChargers: 0,
      rating: 0,
      averageChargeTimeMinutes: 45,
      description: `${city} charging station`,
    })
  }

  if (toInsert.length === 0) {
    logger.info(`[csv-import] no new stations to insert; continuing with charger backfill`)
  }

  let insertedStations = []
  if (toInsert.length > 0) {
    try {
      insertedStations = await Station.insertMany(toInsert, { ordered: false })
    } catch (error) {
      logger.warn(`[csv-import] insertMany had partial failures: ${error.message}`)
      insertedStations = await Station.find({
        $or: toInsert.map((s) => ({
          name: s.name,
          'location.coordinates.0': s.location.coordinates[0],
          'location.coordinates.1': s.location.coordinates[1],
        })),
      })
    }
  }

  const matchedStationIds = []
  for (const row of validCsvRows) {
    const station = await Station.findOne({
      name: row.name,
      'location.coordinates.0': { $gte: row.lng - 0.00001, $lte: row.lng + 0.00001 },
      'location.coordinates.1': { $gte: row.lat - 0.00001, $lte: row.lat + 0.00001 },
    }).select('_id name pricingPerKWh')
    if (station) matchedStationIds.push(station._id)
  }
  const uniqueStationIds = [...new Set(matchedStationIds.map((id) => id.toString()))].map(
    (id) => new mongoose.Types.ObjectId(id),
  )

  const existingChargersAgg = await Charger.aggregate([
    { $match: { station: { $in: uniqueStationIds } } },
    { $group: { _id: '$station', count: { $sum: 1 } } },
  ])
  const chargerCountByStation = new Map(existingChargersAgg.map((r) => [r._id.toString(), r.count]))
  const stationsNeedingChargers = await Station.find({
    _id: { $in: uniqueStationIds.filter((id) => !chargerCountByStation.has(id.toString())) },
  }).select('_id name pricingPerKWh')

  const chargerDocs = []
  for (const station of stationsNeedingChargers) {
    const slots = randomInt(2, 4)
    for (let i = 0; i < slots; i += 1) {
      const type = inferChargerType(station.name)
      const powerKW = inferPowerKW(type)
      const ocppId = `CSV-${station._id.toString().slice(-6)}-${i + 1}-${Date.now().toString().slice(-4)}-${randomInt(10, 99)}`
      chargerDocs.push({
        ocppId,
        station: station._id,
        type,
        connectorType: inferConnector(type),
        powerKW,
        pricePerKWh: station.pricingPerKWh || 12,
        status: chargerStatuses[randomInt(0, chargerStatuses.length - 1)],
        isEnabled: true,
      })
    }
  }

  if (chargerDocs.length > 0) {
    await Charger.insertMany(chargerDocs, { ordered: false })
  }

  const finalAgg = await Charger.aggregate([
    { $match: { station: { $in: uniqueStationIds } } },
    { $group: { _id: '$station', count: { $sum: 1 } } },
  ])
  const stationBulkUpdates = finalAgg.map((row) => ({
    updateOne: {
      filter: { _id: row._id },
      update: { $set: { totalChargers: row.count } },
    },
  }))
  if (stationBulkUpdates.length > 0) {
    await Station.bulkWrite(stationBulkUpdates)
  }

  logger.info(
    `[csv-import] done insertedStations=${toInsert.length} chargersCreated=${chargerDocs.length} parseErrors=${parseErrors.length} stationsWithChargers=${uniqueStationIds.length}`,
  )
  await mongoose.connection.syncIndexes()
  await disconnectDB()
}

run().catch(async (err) => {
  logger.error('[csv-import] failed', err)
  await disconnectDB().catch(() => {})
  process.exit(1)
})
