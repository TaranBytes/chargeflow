import { io } from 'socket.io-client'

/**
 * Lazy Socket.io client. The actual connection is opened by SocketContext
 * when the user is authenticated. Kept here so it's easy to share across
 * the app (e.g., from non-React modules).
 */
let socket = null

export function connectSocket(token) {
  if (socket) return socket
  socket = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:4000', {
    auth: { token },
    autoConnect: false,
    transports: ['websocket'],
    reconnectionAttempts: 5,
    reconnectionDelay: 1500,
  })
  // socket.connect() // Uncomment when backend is online
  return socket
}

export function getSocket() {
  return socket
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect()
    socket = null
  }
}
