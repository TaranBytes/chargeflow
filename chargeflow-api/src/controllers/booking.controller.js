import { asyncHandler } from '../utils/asyncHandler.js'
import * as bookingService from '../services/booking.service.js'

export const createBooking = asyncHandler(async (req, res) => {
  const booking = await bookingService.createBooking({
    userId: req.user.id,
    chargerId: req.body.chargerId,
    startTime: req.body.startTime,
    endTime: req.body.endTime,
    estimatedKWh: req.body.estimatedKWh,
    estimatedCost: req.body.estimatedCost,
  })
  res.status(201).json({ success: true, data: booking.toJSON() })
})

export const myBookings = asyncHandler(async (req, res) => {
  const items = await bookingService.listMyBookings(req.user.id)
  res.json({ success: true, data: items.map((b) => b.toJSON()) })
})

export const cancelBooking = asyncHandler(async (req, res) => {
  const booking = await bookingService.cancelBooking({
    userId: req.user.id,
    bookingId: req.params.id,
    isAdmin: req.user.role === 'admin',
  })
  res.json({ success: true, data: booking.toJSON() })
})
