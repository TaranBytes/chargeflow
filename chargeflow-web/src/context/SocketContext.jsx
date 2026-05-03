import { createContext, useEffect, useRef, useState, useCallback } from 'react'
import { io } from 'socket.io-client'
import { useAuth } from '../hooks/useAuth.js'
import { useToast } from '../hooks/useToast.js'
import { notificationService } from '../services/notification.service.js'

export const SocketContext = createContext(null)

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000'

export function SocketProvider({ children }) {
  const { user } = useAuth()
  const toast = useToast()
  const toastRef = useRef(toast)
  toastRef.current = toast

  const socketRef = useRef(null)
  const dedupeRef = useRef(new Map())
  const hasShownDisconnectRef = useRef(false)

  const [connected, setConnected] = useState(false)
  const [, force] = useState(0)
  const rerender = useCallback(() => force((n) => n + 1), [])

  useEffect(() => {
    if (!user?.token) {
      const s = socketRef.current
      if (s) {
        s.removeAllListeners()
        s.disconnect()
        socketRef.current = null
      }
      setConnected(false)
      return
    }

    const dedupe = (key, ttl = 4000) => {
      const now = Date.now()
      const last = dedupeRef.current.get(key)
      if (last && now - last < ttl) return false
      dedupeRef.current.set(key, now)
      return true
    }

    const socket = io(SOCKET_URL, {
      auth: { token: user.token },
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 8,
      reconnectionDelay: 1500,
      reconnectionDelayMax: 6000,
    })

    socketRef.current = socket
    rerender()

    socket.on('connect', () => {
      setConnected(true)
      if (hasShownDisconnectRef.current) {
        toastRef.current?.success('Reconnected', 'Live updates resumed.')
        hasShownDisconnectRef.current = false
      }
    })

    socket.on('disconnect', (reason) => {
      setConnected(false)
      if (reason !== 'io client disconnect' && !hasShownDisconnectRef.current) {
        hasShownDisconnectRef.current = true
        toastRef.current?.warning(
          'Connection lost',
          'Trying to reconnect — live updates may be delayed.',
        )
      }
    })

    socket.on('connect_error', (err) => {
      // eslint-disable-next-line no-console
      console.warn('[socket] connect_error', err?.message)
    })

    socket.on('bookingCreated', ({ booking } = {}) => {
      if (!booking) return
      const id = booking.id || booking._id
      if (!dedupe(`booking:${id}`, 5000)) return
      const stationName = booking.stationName || booking.station?.name || 'Station'
      const label =
        booking.chargerName ||
        booking.charger?.ocppId ||
        booking.chargerId ||
        'Charger'
      toastRef.current?.success('Booking confirmed', `${label} is reserved.`)
      notificationService.add(
        {
          type: 'booking',
          title: 'Booking confirmed',
          body: `${stationName} · ${label} reserved.`,
          dedupeKey: `booking-created:${id}`,
        },
        { dedupeWindowMs: 12000 },
      )
    })

    socket.on('bookingUpdate', ({ booking } = {}) => {
      if (!booking) return
      if (booking.status === 'CANCELLED') {
        const id = booking.id || booking._id
        if (dedupe(`booking-cancel:${id}`, 5000)) {
          const stationName = booking.stationName || booking.station?.name || 'Station'
          const label =
            booking.chargerName ||
            booking.charger?.ocppId ||
            booking.chargerId ||
            'Charger'
          toastRef.current?.info('Booking cancelled', label)
          notificationService.add(
            {
              type: 'booking',
              title: 'Booking cancelled',
              body: `${stationName} · ${label} was cancelled.`,
              dedupeKey: `booking-cancel:${id}`,
            },
            { dedupeWindowMs: 12000 },
          )
        }
      }
    })

    socket.on('chargingStarted', ({ session } = {}) => {
      if (!session) return
      const id = session.id || session._id
      if (!dedupe(`session-start:${id}`, 5000)) return
      toastRef.current?.success('Charging started', 'Your live session is running.')
      const stationName = session.station?.name || 'Station'
      const chargerLabel = session.charger?.ocppId || 'Charger'
      notificationService.add(
        {
          type: 'session',
          title: 'Charging started',
          body: `${stationName} · ${chargerLabel} session is now live.`,
          dedupeKey: `session-start:${id}`,
        },
        { dedupeWindowMs: 12000 },
      )
    })

    socket.on('chargingStopped', ({ session } = {}) => {
      if (!session) return
      const id = session.id || session._id
      if (!dedupe(`session-stop:${id}`, 5000)) return
      const energy = Number(session.energyConsumed ?? 0).toFixed(1)
      const cost = Number(session.cost ?? 0).toFixed(0)
      toastRef.current?.info('Session ended', `Delivered ${energy} kWh · ₹${cost}`)
      const stationName = session.station?.name || 'Station'
      const chargerLabel = session.charger?.ocppId || 'Charger'
      notificationService.add(
        {
          type: 'session',
          title: 'Session ended',
          body: `${stationName} · ${chargerLabel} delivered ${energy} kWh · ₹${cost}.`,
          dedupeKey: `session-stop:${id}`,
        },
        { dedupeWindowMs: 12000 },
      )
    })

    socket.on('chargerStatusUpdate', (evt = {}) => {
      // Throttle aggressively — pages handle in-context updates via subscribe();
      // global toasts only for critical transitions.
      if (!['OFFLINE', 'FAULTED'].includes(evt.status)) return
      const key = `cs:${evt.chargerId}:${evt.status}`
      if (!dedupe(key, 8000)) return
      toastRef.current?.warning(
        'Charger update',
        `${evt.ocppId ?? 'Charger'} is now ${String(evt.status).toLowerCase()}.`,
      )
    })

    return () => {
      socket.removeAllListeners()
      socket.disconnect()
      socketRef.current = null
      setConnected(false)
    }
  }, [user?.token, rerender])

  const subscribe = useCallback((event, handler) => {
    const s = socketRef.current
    if (!s) return () => {}
    s.on(event, handler)
    return () => s.off(event, handler)
  }, [])

  const emit = useCallback((event, payload) => {
    socketRef.current?.emit(event, payload)
  }, [])

  return (
    <SocketContext.Provider
      value={{ socket: socketRef.current, connected, subscribe, emit }}
    >
      {children}
    </SocketContext.Provider>
  )
}
