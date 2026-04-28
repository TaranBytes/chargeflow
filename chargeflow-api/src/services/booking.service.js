import { Booking } from '../models/Booking.model.js'
import { Charger } from '../models/Charger.model.js'
import { ApiError } from '../utils/ApiError.js'
import {
  emitBookingCreated,
  emitChargerStatusUpdate,
  emitBookingUpdate,
} from '../sockets/index.js'

const ACTIVE_BOOKING_STATUSES = ['CONFIRMED', 'PENDING', 'IN_PROGRESS']

/**
 * Create a booking with strict overlap detection on the target charger.
 *
 * Overlap rule (half-open intervals):
 *   existing.startTime < newEnd AND existing.endTime > newStart
 */
export async function createBooking({
  userId,
  chargerId,
  startTime,
  endTime,
  estimatedKWh = 0,
  estimatedCost = 0,
}) {
  const start = new Date(startTime)
  const end = new Date(endTime)
  const now = new Date()

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    throw ApiError.badRequest('Invalid startTime or endTime', 'INVALID_DATE')
  }
  if (end <= start) {
    throw ApiError.badRequest('endTime must be after startTime', 'INVALID_RANGE')
  }
  if (end <= now) {
    throw ApiError.badRequest('Cannot book in the past', 'PAST_BOOKING')
  }

  const charger = await Charger.findById(chargerId)
  if (!charger) throw ApiError.notFound('Charger not found')
  if (['OFFLINE', 'FAULTED'].includes(charger.status)) {
    throw ApiError.badRequest(
      `Charger is ${charger.status.toLowerCase()} and cannot be booked`,
      'CHARGER_UNAVAILABLE',
    )
  }

  // ── Conflict detection ────────────────────────────────────────────────────
  const conflict = await Booking.findOne({
    charger: chargerId,
    status: { $in: ACTIVE_BOOKING_STATUSES },
    startTime: { $lt: end },
    endTime: { $gt: start },
  })
    .select('_id startTime endTime')
    .lean()

  if (conflict) {
    throw ApiError.conflict(
      'This charger already has a booking that overlaps with the requested time.',
      'BOOKING_CONFLICT',
      {
        conflictingBookingId: conflict._id,
        conflictingStart: conflict.startTime,
        conflictingEnd: conflict.endTime,
      },
    )
  }

  const booking = await Booking.create({
    user: userId,
    charger: chargerId,
    station: charger.station,
    startTime: start,
    endTime: end,
    estimatedKWh,
    estimatedCost,
    status: 'CONFIRMED',
  })

  // Per spec: mark charger RESERVED on booking creation (only if currently AVAILABLE).
  if (charger.status === 'AVAILABLE') {
    charger.status = 'RESERVED'
    charger.currentBooking = booking._id
    await charger.save()
    emitChargerStatusUpdate(charger)
  }

  const populated = await booking.populate(['charger', 'station'])
  emitBookingCreated(populated)
  return populated
}

export async function listMyBookings(userId) {
  return Booking.find({ user: userId })
    .sort({ startTime: -1 })
    .populate('charger', 'ocppId type connectorType powerKW')
    .populate('station', 'name address location')
}

export async function cancelBooking({ userId, bookingId, isAdmin = false }) {
  const booking = await Booking.findById(bookingId)
  if (!booking) throw ApiError.notFound('Booking not found')

  if (!isAdmin && booking.user.toString() !== userId.toString()) {
    throw ApiError.forbidden('You can only cancel your own bookings')
  }
  if (!ACTIVE_BOOKING_STATUSES.includes(booking.status)) {
    throw ApiError.badRequest(
      `Cannot cancel a booking in status ${booking.status}`,
      'INVALID_TRANSITION',
    )
  }

  booking.status = 'CANCELLED'
  booking.cancelReason = 'user_cancelled'
  await booking.save()

  // If this booking is what's pinning the charger to RESERVED, free it up.
  const charger = await Charger.findById(booking.charger)
  if (charger && charger.currentBooking?.toString() === booking.id && charger.status === 'RESERVED') {
    charger.currentBooking = null
    charger.status = 'AVAILABLE'
    await charger.save()
    emitChargerStatusUpdate(charger)
  }

  emitBookingUpdate(booking)
  return booking
}
