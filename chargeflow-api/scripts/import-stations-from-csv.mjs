/**
 * Import EV charging stations from a CSV into MongoDB.
 *
 * Expected columns (header row): name, state, city, address, lattitude, longitude, type
 * (CSV uses typo "lattitude"; "latitude" is also accepted.)
 *
 *   npm run import:stations:csv -- --file=../ev-charging-stations-india.csv
 */
import fs from 'fs'
import path from 'path'
import crypto from 'crypto'
import { createReadStream } from 'fs'
import csv from 'csv-parser'
import { connectDB, disconnectDB } from '../src/config/db.js'
import { Station } from '../src/models/Station.model.js'
import { Charger } from '../src/models/Charger.model.js'
import { logger } from '../src/utils/logger.js'

const CSV_DESCRIPTION = 'Imported from ev-charging-stations-india.csv'

function parseFileArg() {
  const argv = process.argv.slice(2)
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (a.startsWith('--file=')) return a.slice('--file='.length)
    if (a === '--file' && argv[i + 1]) return argv[++i]
  }
  return null
}

function stableOcppId(row) {
  const lat = String(row.lattitude ?? row.latitude ?? '').trim()
  const lng = String(row.longitude ?? '').trim()
  const key = `${(row.name || '').trim()}|${(row.city || '').trim()}|${lat}|${lng}`
  const h = crypto.createHash('sha256').update(key).digest('hex').slice(0, 20)
  return `IMP-${h}`
}

function inferCharger(row) {
  const name = (row.name || '').toUpperCase()
  const typeCol = parseInt(String(row.type ?? '').trim(), 10)
  const powerKW = Number.isFinite(typeCol) && typeCol > 0 ? typeCol : null

  const looksAC = /\bAC\b/.test(name) && !/\bDC\b/.test(name)
  const looksDC = /\bDC\b/.test(name)

  if (looksAC || (!looksDC && name.includes('AC CHARGING'))) {
    return {
      type: 'AC',
      connectorType: 'Type2',
      powerKW: powerKW ?? 22,
      pricePerKWh: 12,
    }
  }
  return {
    type: 'DC',
    connectorType: 'CCS',
    powerKW: powerKW ?? 60,
    pricePerKWh: 16,
  }
}

async function importFromCsv(filePath) {
  const resolved = path.resolve(filePath)
  if (!fs.existsSync(resolved)) {
    logger.error(`[import] file not found: ${resolved}`)
    process.exit(1)
  }

  let imported = 0
  let skipped = 0
  let failed = 0

  const stream = createReadStream(resolved).pipe(
    csv({
      mapHeaders: ({ header }) => header.trim(),
      skipLines: 0,
    }),
  )

  for await (const row of stream) {
    const name = (row.name || '').trim()
    if (!name) {
      skipped++
      continue
    }

    const latStr = row.lattitude ?? row.latitude
    const lngStr = row.longitude
    const lat = parseFloat(latStr)
    const lng = parseFloat(lngStr)
    if (!Number.isFinite(lat) || !Number.isFinite(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      skipped++
      continue
    }

    const ocppId = stableOcppId({ ...row, name, lattitude: latStr, longitude: lngStr })
    const existingCharger = await Charger.findOne({ ocppId })
    if (existingCharger) {
      skipped++
      continue
    }

    const city = (row.city || '').trim()
    const state = (row.state || '').trim()
    const addrLine = (row.address || '').trim()

    try {
      const station = await Station.create({
        name,
        description: CSV_DESCRIPTION,
        address: {
          line1: addrLine || name,
          city,
          state,
          country: 'India',
        },
        location: {
          type: 'Point',
          coordinates: [lng, lat],
        },
        rating: 4.2,
        operatingHours: '24/7',
        amenities: ['Restroom'],
        totalChargers: 1,
        pricingPerKWh: 12,
        status: 'ACTIVE',
      })

      const ch = inferCharger(row)
      await Charger.create({
        ocppId,
        station: station._id,
        type: ch.type,
        connectorType: ch.connectorType,
        powerKW: ch.powerKW,
        pricePerKWh: ch.pricePerKWh,
        status: 'AVAILABLE',
      })
      imported++
      if (imported % 200 === 0) {
        logger.info(`[import] progress… ${imported} stations imported`)
      }
    } catch (err) {
      failed++
      logger.warn(`[import] row failed (${name}):`, err.message)
    }
  }

  logger.info(`[import] done — imported: ${imported}, skipped: ${skipped}, failed: ${failed}`)
}

async function main() {
  const fileArg = parseFileArg()
  if (!fileArg) {
    // eslint-disable-next-line no-console
    console.error('Usage: node scripts/import-stations-from-csv.mjs --file=path/to.csv')
    process.exit(1)
  }

  await connectDB()
  try {
    await importFromCsv(fileArg)
  } finally {
    await disconnectDB()
  }
}

main().catch((e) => {
  logger.error('[import] fatal', e)
  process.exit(1)
})
