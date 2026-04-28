// Lightweight singleton so any service / controller can grab the io instance
// without us having to thread it through every function call.
let ioInstance = null

export function setIO(io) {
  ioInstance = io
}

export function getIO() {
  if (!ioInstance) {
    // Don't crash — services should still work in tests / scripts where socket
    // isn't bootstrapped. We just no-op emits in that case.
    return null
  }
  return ioInstance
}
