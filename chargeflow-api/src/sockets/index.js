import { Server } from 'socket.io'
import { verifyAccessToken } from '../utils/jwt.js'
import { getIO, setIO } from '../config/socket.js'
import { logger } from '../utils/logger.js'
import { env } from '../config/env.js'

/**
 * Bootstrap Socket.io with JWT auth middleware and room subscription handlers.
 * Returns the io instance (also stashed in the singleton for emit helpers).
 */
export function initSocket(httpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: env.corsOrigins,
      credentials: true,
    },
  })

  // ── Handshake auth ────────────────────────────────────────────────────────
  io.use((socket, next) => {
    const token =
      socket.handshake.auth?.token ||
      socket.handshake.headers?.authorization?.replace(/^Bearer\s+/i, '')
    if (!token) return next(new Error('UNAUTHENTICATED'))
    try {
      const decoded = verifyAccessToken(token)
      socket.user = { id: decoded.userId, role: decoded.role }
      next()
    } catch {
      next(new Error('INVALID_TOKEN'))
    }
  })

  // ── Connection handler ────────────────────────────────────────────────────
  io.on('connection', (socket) => {
    const { id: userId, role } = socket.user
    socket.join(`user:${userId}`)
    socket.join(`role:${role}`)
    logger.info(`[socket] connected user=${userId} (${socket.id})`)

    socket.on('subscribe:station', ({ stationId } = {}) => {
      if (stationId) socket.join(`station:${stationId}`)
    })
    socket.on('unsubscribe:station', ({ stationId } = {}) => {
      if (stationId) socket.leave(`station:${stationId}`)
    })
    socket.on('subscribe:charger', ({ chargerId } = {}) => {
      if (chargerId) socket.join(`charger:${chargerId}`)
    })
    socket.on('subscribe:session', ({ sessionId } = {}) => {
      // Only let users subscribe to their own sessions; verify via DB if needed.
      if (sessionId) socket.join(`session:${sessionId}`)
    })

    socket.on('disconnect', (reason) => {
      logger.info(`[socket] disconnected ${socket.id} (${reason})`)
    })
  })

  setIO(io)
  return io
}

// ─── Emit helpers ───────────────────────────────────────────────────────────
// All helpers are no-ops if the io instance hasn't been set (tests / scripts).

export function emitChargerStatusUpdate(charger) {
  const io = getIO()
  if (!io || !charger) return
  const payload = {
    chargerId: charger.id || charger._id?.toString(),
    stationId: charger.station?.toString?.() || charger.station,
    status: charger.status,
    ocppId: charger.ocppId,
  }
  io.to(`charger:${payload.chargerId}`)
    .to(`station:${payload.stationId}`)
    .emit('chargerStatusUpdate', payload)
}

export function emitBookingCreated(booking) {
  const io = getIO()
  if (!io || !booking) return
  const userId = booking.user?._id?.toString?.() || booking.user?.toString()
  io.to(`user:${userId}`).emit('bookingCreated', { booking: booking.toJSON?.() ?? booking })
}

export function emitBookingUpdate(booking) {
  const io = getIO()
  if (!io || !booking) return
  const userId = booking.user?._id?.toString?.() || booking.user?.toString()
  io.to(`user:${userId}`).emit('bookingUpdate', { booking: booking.toJSON?.() ?? booking })
}

export function emitChargingStarted(session) {
  const io = getIO()
  if (!io || !session) return
  const userId = session.user?._id?.toString?.() || session.user?.toString()
  const sessionId = session.id || session._id?.toString()
  io.to(`user:${userId}`)
    .to(`session:${sessionId}`)
    .emit('chargingStarted', { session: session.toJSON?.() ?? session })
}

export function emitChargingStopped(session) {
  const io = getIO()
  if (!io || !session) return
  const userId = session.user?._id?.toString?.() || session.user?.toString()
  const sessionId = session.id || session._id?.toString()
  io.to(`user:${userId}`)
    .to(`session:${sessionId}`)
    .emit('chargingStopped', { session: session.toJSON?.() ?? session })
}

export function emitSessionTick(session, payload) {
  const io = getIO()
  if (!io || !session) return
  const sessionId = session.id || session._id?.toString()
  io.to(`session:${sessionId}`).emit('sessionTick', { sessionId, ...payload })
}
