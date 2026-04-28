/**
 * Operational error class. Use this in services/controllers when you want the
 * HTTP layer to translate the failure into a clean status + JSON body.
 */
export class ApiError extends Error {
  constructor(statusCode = 500, message = 'Server error', code = 'ERROR', details = null) {
    super(message)
    this.name = 'ApiError'
    this.statusCode = statusCode
    this.code = code
    this.details = details
    this.isOperational = true
    Error.captureStackTrace?.(this, this.constructor)
  }
}

// Pre-baked factories for the cases we hit constantly.
ApiError.badRequest = (message = 'Bad request', code = 'BAD_REQUEST', details) =>
  new ApiError(400, message, code, details)
ApiError.unauthorized = (message = 'Not authenticated', code = 'UNAUTHENTICATED') =>
  new ApiError(401, message, code)
ApiError.forbidden = (message = 'Forbidden', code = 'FORBIDDEN') =>
  new ApiError(403, message, code)
ApiError.notFound = (message = 'Not found', code = 'NOT_FOUND') =>
  new ApiError(404, message, code)
ApiError.conflict = (message = 'Conflict', code = 'CONFLICT', details) =>
  new ApiError(409, message, code, details)
