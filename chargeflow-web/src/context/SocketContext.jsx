import { createContext, useEffect, useRef, useState, useCallback } from 'react'

export const SocketContext = createContext(null)

/**
 * Placeholder Socket.io provider. The plumbing is in place so when the
 * backend is ready we just uncomment the connection block + import io().
 *
 * Usage example (post-backend):
 *   import { io } from 'socket.io-client'
 *   const socket = io(import.meta.env.VITE_SOCKET_URL, { auth: { token } })
 *   socket.on('connect', () => setConnected(true))
 *   socket.on('disconnect', () => setConnected(false))
 *   socketRef.current = socket
 */
export function SocketProvider({ children }) {
  const socketRef = useRef(null)
  const [connected, setConnected] = useState(false)

  useEffect(() => {
    // No-op placeholder. Wire real socket here once backend exists.
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect?.()
        socketRef.current = null
      }
    }
  }, [])

  const subscribe = useCallback((event, handler) => {
    const s = socketRef.current
    if (!s) return () => {}
    s.on(event, handler)
    return () => s.off(event, handler)
  }, [])

  const emit = useCallback((event, payload) => {
    const s = socketRef.current
    if (!s) return
    s.emit(event, payload)
  }, [])

  return (
    <SocketContext.Provider
      value={{ socket: socketRef.current, connected, subscribe, emit }}
    >
      {children}
    </SocketContext.Provider>
  )
}
