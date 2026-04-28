import { ChargingSession } from '../models/Session.model.js'
import { Charger } from '../models/Charger.model.js'
import { Booking } from '../models/Booking.model.js'
import { ApiError } from '../utils/ApiError.js'
import {
  emitChargingStarted,
  emitChargingStopped,
  emitChargerStatusUpdate,
} from '../sockets/index.js'

/**
 * Start a charging session on a charger.
 * - Charger must be AVAILABLE or RESERVED (i.e., not in use).
 * - On success: charger.status → OCCUPIED.
 */
export async function startSession({ userId, chargerId, bookingId = null }) {
  const charger = await Charger.findById(chargerId)
  if (!charger) throw ApiError.notFound('Charger not found')
  if (charger.status === 'OCCUPIED') {
    throw ApiError.conflict('Charger is already in use', 'CHARGER_BUSY')
  }
  if (['OFFLINE', 'FAULTED'].includes(charger.status)) {
    throw ApiError.badRequest('Charger is not operational', 'CHARGER_UNAVAILABLE')
  }

  let booking = null
  if (bookingId) {
    booking = await Booking.findById(bookingId)
    if (!booking) throw ApiError.notFound('Booking not found')
    if (booking.user.toString() !== userId.toString()) {
      throw ApiError.forbidden('Booking does not belong to this user')
    }
    if (!['CONFIRMED', 'PENDING'].includes(booking.status)) {
      throw ApiError.badRequest(
        `Cannot start a session for a booking in status ${booking.status}`,
        'INVALID_TRANSITION',
      )
    }
  }

  const session = await ChargingSession.create({
    user: userId,
    charger: charger._id,
    station: charger.station,
    booking: booking?._id || null,
    startTime: new Date(),
    status: 'ACTIVE',
    energyConsumed: 0,
    cost: 0,
  })

  charger.status = 'OCCUPIED'
  charger.currentSession = session._id
  charger.currentBooking = booking?._id || charger.currentBooking
  await charger.save()

  if (booking) {
    booking.status = 'IN_PROGRESS'
    booking.session = session._id
    await booking.save()
  }

  emitChargingStarted(session)
  emitChargerStatusUpdate(charger)
  return session
}

/**
 * Stop a session.
 * - Charger.status → AVAILABLE.
 * - Cost computed as energyConsumed × charger.pricePerKWh (final value can be passed in).
 */
export async function stopSession({ userId, sessionId, energyConsumed, isAdmin = false }) {
  const session = await ChargingSession.findById(sessionId)
  if (!session) throw ApiError.notFound('Session not found')
  if (!isAdmin && session.user.toString() !== userId.toString()) {
    throw ApiError.forbidden('You can only stop your own session')
  }
  if (session.status !== 'ACTIVE') {
    throw ApiError.badRequest(`Session is ${session.status}`, 'INVALID_TRANSITION')
  }

  const charger = await Charger.findById(session.charger)
  const finalEnergy =
    typeof energyConsumed === 'number' && energyConsumed >= 0
      ? energyConsumed
      : session.energyConsumed
  const finalCost = charger ? finalEnergy * charger.pricePerKWh : 0

  session.endTime = new Date()
  session.energyConsumed = finalEnergy
  session.cost = Number(finalCost.toFixed(2))
  session.status = 'COMPLETED'
  await session.save()

  if (charger) {
    charger.status = 'AVAILABLE'
    charger.currentSession = null
    charger.currentBooking = null
    await charger.save()
    emitChargerStatusUpdate(charger)
  }

  if (session.booking) {
    await Booking.findByIdAndUpdate(session.booking, { status: 'COMPLETED' })
  }

  emitChargingStopped(session)
  return session
}

export async function getActiveSessionForUser(userId) {
  return ChargingSession.findOne({ user: userId, status: 'ACTIVE' })
    .populate('charger', 'ocppId type connectorType powerKW pricePerKWh')
    .populate('station', 'name address')
}
