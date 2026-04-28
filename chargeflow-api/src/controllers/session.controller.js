import { asyncHandler } from '../utils/asyncHandler.js'
import * as sessionService from '../services/session.service.js'
import { ApiError } from '../utils/ApiError.js'

export const startSession = asyncHandler(async (req, res) => {
  const session = await sessionService.startSession({
    userId: req.user.id,
    chargerId: req.body.chargerId,
    bookingId: req.body.bookingId || null,
  })
  res.status(201).json({ success: true, data: session.toJSON() })
})

export const stopSession = asyncHandler(async (req, res) => {
  const session = await sessionService.stopSession({
    userId: req.user.id,
    sessionId: req.params.id,
    energyConsumed: req.body?.energyConsumed,
    isAdmin: req.user.role === 'admin',
  })
  res.json({ success: true, data: session.toJSON() })
})

export const activeSession = asyncHandler(async (req, res) => {
  const session = await sessionService.getActiveSessionForUser(req.user.id)
  if (!session) throw ApiError.notFound('No active session')
  res.json({ success: true, data: session.toJSON() })
})
