/**
 * Seed script — populates ChargeFlow with sample stations, chargers, users,
 * and a demo booking. Mirrors the frontend mock data so the dashboard looks
 * identical when wired to the real backend.
 *
 *   npm run seed         # upserts (idempotent)
 *   npm run seed:reset   # drops + reseeds
 */
import mongoose from 'mongoose'
import { env } from '../src/config/env.js'
import { connectDB, disconnectDB } from '../src/config/db.js'
import { User } from '../src/models/User.model.js'
import { Station } from '../src/models/Station.model.js'
import { Charger } from '../src/models/Charger.model.js'
import { Booking } from '../src/models/Booking.model.js'
import { ChargingSession } from '../src/models/Session.model.js'
import { logger } from '../src/utils/logger.js'

const RESET = process.argv.includes('--reset')

const STATIONS = [
  {
    key: 's_001',
    name: 'Connaught Place SuperCharger',
    description: 'Premium fast-charging hub in central Delhi.',
    address: { line1: 'Block A, Connaught Place', city: 'New Delhi', state: 'DL', country: 'India', postalCode: '110001' },
    coords: [77.2167, 28.6315],
    rating: 4.7,
    averageChargeTimeMinutes: 38,
    operatingHours: '24/7',
    amenities: ['Cafe', 'Restroom', 'Wi-Fi', 'Lounge'],
    images: ['https://images.unsplash.com/photo-1593941707882-a5bba14938c7?w=1200&q=80'],
    chargers: [
      { ocppId: 'CP-001', type: 'DC', connectorType: 'CCS', powerKW: 150, pricePerKWh: 18, status: 'AVAILABLE' },
      { ocppId: 'CP-002', type: 'DC', connectorType: 'CHAdeMO', powerKW: 100, pricePerKWh: 16, status: 'OCCUPIED' },
      { ocppId: 'CP-003', type: 'AC', connectorType: 'Type2', powerKW: 22, pricePerKWh: 12, status: 'AVAILABLE' },
      { ocppId: 'CP-004', type: 'DC', connectorType: 'CCS', powerKW: 150, pricePerKWh: 18, status: 'RESERVED' },
    ],
  },
  {
    key: 's_002',
    name: 'Cyber Hub FastCharge',
    description: 'Conveniently located in Cyber Hub, Gurgaon.',
    address: { line1: 'Cyber Hub, DLF Cyber City', city: 'Gurugram', state: 'HR', country: 'India', postalCode: '122002' },
    coords: [77.0890, 28.4951],
    rating: 4.5,
    averageChargeTimeMinutes: 42,
    operatingHours: '06:00 – 23:00',
    amenities: ['Cafe', 'Restroom', 'Shopping'],
    images: ['https://images.unsplash.com/photo-1620891549027-942faf26c0e9?w=1200&q=80'],
    chargers: [
      { ocppId: 'CP-005', type: 'DC', connectorType: 'CCS', powerKW: 60, pricePerKWh: 16, status: 'AVAILABLE' },
      { ocppId: 'CP-006', type: 'AC', connectorType: 'Type2', powerKW: 22, pricePerKWh: 11, status: 'AVAILABLE' },
    ],
  },
  {
    key: 's_003',
    name: 'Saket Mall ChargePoint',
    description: 'Mall parking lot DC fast chargers.',
    address: { line1: 'Select Citywalk, Saket', city: 'New Delhi', state: 'DL', country: 'India', postalCode: '110017' },
    coords: [77.2197, 28.5286],
    rating: 4.3,
    averageChargeTimeMinutes: 46,
    operatingHours: '10:00 – 22:00',
    amenities: ['Mall', 'Food Court'],
    images: ['https://images.unsplash.com/photo-1633113213050-7869fb6e51ce?w=1200&q=80'],
    chargers: [
      { ocppId: 'CP-007', type: 'DC', connectorType: 'CCS', powerKW: 50, pricePerKWh: 15, status: 'OCCUPIED' },
      { ocppId: 'CP-008', type: 'DC', connectorType: 'CCS', powerKW: 50, pricePerKWh: 15, status: 'OCCUPIED' },
      { ocppId: 'CP-009', type: 'AC', connectorType: 'Type2', powerKW: 11, pricePerKWh: 10, status: 'AVAILABLE' },
    ],
  },
  {
    key: 's_004',
    name: 'Noida Sector 18 ChargeHub',
    description: 'Family-friendly station with cafe and parking.',
    address: { line1: 'Sector 18', city: 'Noida', state: 'UP', country: 'India', postalCode: '201301' },
    coords: [77.3260, 28.5707],
    rating: 4.6,
    averageChargeTimeMinutes: 40,
    operatingHours: '24/7',
    amenities: ['Cafe', 'Wi-Fi', 'Restroom'],
    images: ['https://images.unsplash.com/photo-1606925797300-0b35e9d1794e?w=1200&q=80'],
    chargers: [
      { ocppId: 'CP-010', type: 'DC', connectorType: 'CCS', powerKW: 120, pricePerKWh: 17, status: 'AVAILABLE' },
      { ocppId: 'CP-011', type: 'DC', connectorType: 'CCS', powerKW: 120, pricePerKWh: 17, status: 'AVAILABLE' },
      { ocppId: 'CP-012', type: 'AC', connectorType: 'Type2', powerKW: 22, pricePerKWh: 12, status: 'RESERVED' },
    ],
  },
  {
    key: 's_005',
    name: 'Greater Kailash EV Point',
    description: 'Reliable charging in South Delhi.',
    address: { line1: 'M Block Market, GK-1', city: 'New Delhi', state: 'DL', country: 'India', postalCode: '110048' },
    coords: [77.2453, 28.5436],
    rating: 4.2,
    averageChargeTimeMinutes: 58,
    operatingHours: '07:00 – 23:00',
    amenities: ['Restroom'],
    images: ['https://images.unsplash.com/photo-1586282391129-76a6df230234?w=1200&q=80'],
    chargers: [
      { ocppId: 'CP-013', type: 'AC', connectorType: 'Type2', powerKW: 7, pricePerKWh: 9, status: 'AVAILABLE' },
      { ocppId: 'CP-014', type: 'AC', connectorType: 'Type2', powerKW: 7, pricePerKWh: 9, status: 'OCCUPIED' },
    ],
  },
  {
    key: 's_006',
    name: 'IGI Airport T3 Express',
    description: 'High-power chargers at airport long-term parking.',
    address: { line1: 'Terminal 3, IGI Airport', city: 'New Delhi', state: 'DL', country: 'India', postalCode: '110037' },
    coords: [77.1000, 28.5562],
    rating: 4.4,
    averageChargeTimeMinutes: 34,
    operatingHours: '24/7',
    amenities: ['Wi-Fi', 'Restroom', 'Lounge'],
    images: ['https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1200&q=80'],
    chargers: [
      { ocppId: 'CP-015', type: 'DC', connectorType: 'CCS', powerKW: 180, pricePerKWh: 20, status: 'AVAILABLE' },
      { ocppId: 'CP-016', type: 'DC', connectorType: 'CCS', powerKW: 180, pricePerKWh: 20, status: 'AVAILABLE' },
    ],
  },
  {
    key: 's_007',
    name: 'Dwarka Sector 21 Charge Plaza',
    description: 'Multi-connector fast charging close to metro and airport line.',
    address: { line1: 'Sector 21, Dwarka', city: 'New Delhi', state: 'DL', country: 'India', postalCode: '110077' },
    coords: [77.0717, 28.5510],
    rating: 4.6,
    averageChargeTimeMinutes: 36,
    operatingHours: '24/7',
    amenities: ['Restroom', 'Cafe', 'Wi-Fi'],
    images: ['https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=1200&q=80'],
    chargers: [
      { ocppId: 'CP-017', type: 'DC', connectorType: 'CCS', powerKW: 120, pricePerKWh: 18, status: 'AVAILABLE' },
      { ocppId: 'CP-018', type: 'DC', connectorType: 'CHAdeMO', powerKW: 90, pricePerKWh: 16, status: 'AVAILABLE' },
      { ocppId: 'CP-019', type: 'AC', connectorType: 'Type2', powerKW: 22, pricePerKWh: 11, status: 'RESERVED' },
    ],
  },
  {
    key: 's_008',
    name: 'Rajouri Garden GreenCharge',
    description: 'Neighborhood charging station in West Delhi.',
    address: { line1: 'Main Market Road, Rajouri Garden', city: 'New Delhi', state: 'DL', country: 'India', postalCode: '110027' },
    coords: [77.1229, 28.6423],
    rating: 4.3,
    averageChargeTimeMinutes: 49,
    operatingHours: '06:00 – 23:30',
    amenities: ['Restroom', 'Convenience Store'],
    images: ['https://images.unsplash.com/photo-1489515217757-5fd1be406fef?w=1200&q=80'],
    chargers: [
      { ocppId: 'CP-020', type: 'DC', connectorType: 'CCS', powerKW: 60, pricePerKWh: 15, status: 'AVAILABLE' },
      { ocppId: 'CP-021', type: 'AC', connectorType: 'Type2', powerKW: 22, pricePerKWh: 10, status: 'AVAILABLE' },
    ],
  },
  {
    key: 's_009',
    name: 'Clock Tower EV Hub',
    description: 'Central Dehradun station for quick top-ups and overnight charging.',
    address: { line1: 'Near Clock Tower', city: 'Dehradun', state: 'Uttarakhand', country: 'India', postalCode: '248001' },
    coords: [78.0322, 30.3255],
    rating: 4.5,
    averageChargeTimeMinutes: 44,
    operatingHours: '24/7',
    amenities: ['Restroom', 'Cafe'],
    images: ['https://images.unsplash.com/photo-1556740749-887f6717d7e4?w=1200&q=80'],
    chargers: [
      { ocppId: 'CP-022', type: 'DC', connectorType: 'CCS', powerKW: 100, pricePerKWh: 16, status: 'AVAILABLE' },
      { ocppId: 'CP-023', type: 'AC', connectorType: 'Type2', powerKW: 22, pricePerKWh: 11, status: 'OCCUPIED' },
    ],
  },
  {
    key: 's_010',
    name: 'ISBT Dehradun Fast Lane',
    description: 'High-turnover chargers for intercity commuters.',
    address: { line1: 'ISBT Complex, Majra', city: 'Dehradun', state: 'Uttarakhand', country: 'India', postalCode: '248171' },
    coords: [78.0016, 30.2880],
    rating: 4.4,
    averageChargeTimeMinutes: 39,
    operatingHours: '05:00 – 00:00',
    amenities: ['Waiting Lounge', 'Restroom', 'Snacks'],
    images: ['https://images.unsplash.com/photo-1518005020951-eccb494ad742?w=1200&q=80'],
    chargers: [
      { ocppId: 'CP-024', type: 'DC', connectorType: 'CCS', powerKW: 150, pricePerKWh: 19, status: 'AVAILABLE' },
      { ocppId: 'CP-025', type: 'DC', connectorType: 'CCS', powerKW: 150, pricePerKWh: 19, status: 'AVAILABLE' },
      { ocppId: 'CP-026', type: 'AC', connectorType: 'Type2', powerKW: 22, pricePerKWh: 12, status: 'RESERVED' },
    ],
  },
]

async function reset() {
  logger.warn('[seed] --reset → dropping collections')
  await Promise.all([
    User.deleteMany({}),
    Station.deleteMany({}),
    Charger.deleteMany({}),
    Booking.deleteMany({}),
    ChargingSession.deleteMany({}),
  ])
}

async function upsertUsers() {
  const passwordHash = await User.hashPassword('demo1234')
  const users = [
    {
      name: 'Sahib Singh',
      email: 'sahib@chargeflow.dev',
      passwordHash,
      role: 'user',
      avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=Sahib%20Singh&backgroundColor=10b981',
      vehicles: [
        { make: 'Tata', model: 'Nexon EV', batteryKWh: 40, connectorType: 'CCS' },
        { make: 'MG', model: 'ZS EV', batteryKWh: 50, connectorType: 'CCS' },
      ],
    },
    {
      name: 'Demo User',
      email: 'demo@chargeflow.dev',
      passwordHash,
      role: 'user',
      avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=Demo%20User&backgroundColor=10b981',
    },
    {
      name: 'Operator Admin',
      email: 'admin@chargeflow.dev',
      passwordHash,
      role: 'admin',
    },
  ]

  for (const u of users) {
    await User.updateOne({ email: u.email }, { $set: u }, { upsert: true })
  }
  logger.info(`[seed] users upserted (${users.length})`)
  return User.find({ email: { $in: users.map((u) => u.email) } })
}

async function upsertStationsAndChargers() {
  let totalChargers = 0
  for (const s of STATIONS) {
    const stationDoc = await Station.findOneAndUpdate(
      { name: s.name },
      {
        $set: {
          name: s.name,
          description: s.description,
          address: s.address,
          location: { type: 'Point', coordinates: s.coords },
          rating: s.rating,
          operatingHours: s.operatingHours,
          amenities: s.amenities,
          images: s.images,
          averageChargeTimeMinutes: s.averageChargeTimeMinutes,
          totalChargers: s.chargers.length,
          status: 'ACTIVE',
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    )

    for (const c of s.chargers) {
      await Charger.updateOne(
        { ocppId: c.ocppId },
        { $set: { ...c, station: stationDoc._id } },
        { upsert: true },
      )
      totalChargers++
    }
  }
  logger.info(`[seed] stations upserted (${STATIONS.length}), chargers (${totalChargers})`)
}

async function upsertSampleBooking(users) {
  const sahib = users.find((u) => u.email === 'sahib@chargeflow.dev')
  const station = await Station.findOne({ name: 'Connaught Place SuperCharger' })
  if (!sahib || !station) return
  const charger = await Charger.findOne({ station: station._id, ocppId: 'CP-001' })
  if (!charger) return

  // Skip if Sahib already has an upcoming booking on this charger.
  const existing = await Booking.findOne({
    user: sahib._id,
    charger: charger._id,
    status: { $in: ['CONFIRMED', 'PENDING'] },
  })
  if (existing) {
    logger.info('[seed] sample booking already present')
    return
  }

  const start = new Date(Date.now() + 60 * 60 * 1000) // 1h from now
  const end = new Date(start.getTime() + 30 * 60 * 1000)

  await Booking.create({
    user: sahib._id,
    charger: charger._id,
    station: station._id,
    startTime: start,
    endTime: end,
    estimatedKWh: 25,
    estimatedCost: 450,
    status: 'CONFIRMED',
    paymentStatus: 'PAID',
  })
  logger.info('[seed] sample booking created')
}

async function run() {
  logger.info(`[seed] connecting to ${env.mongoUri.replace(/:\/\/[^@]+@/, '://***@')}`)
  await connectDB()
  if (RESET) await reset()
  const users = await upsertUsers()
  await upsertStationsAndChargers()
  await upsertSampleBooking(users)
  await mongoose.connection.syncIndexes()
  logger.info('[seed] done ✅')
  await disconnectDB()
}

run().catch(async (err) => {
  logger.error('[seed] failed', err)
  await disconnectDB().catch(() => {})
  process.exit(1)
})
