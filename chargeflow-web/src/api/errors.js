/**
 * Single source of truth for API errors throughout the app.
 * Every API call funnels axios/network errors through `normalizeError`
 * so UI code can rely on a stable shape:
 *
 *   { message: string, status: number, code: string, details?: any }
 */

export class ApiError extends Error {
  constructor(message, { status = 0, code = 'UNKNOWN', details = null, cause } = {}) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.details = details
    if (cause) this.cause = cause
  }
}

export function normalizeError(err) {
  if (err instanceof ApiError) return err

  // Axios error with a server response
  if (err?.response) {
    const { status, data } = err.response
    const message =
      data?.error?.message ||
      data?.message ||
      (status >= 500
        ? 'The server is having trouble. Please try again in a moment.'
        : `Request failed (${status})`)
    return new ApiError(message, {
      status,
      code: data?.error?.code || `HTTP_${status}`,
      details: data?.error?.details ?? data,
      cause: err,
    })
  }

  // Request made, no response (network / CORS / offline)
  if (err?.request) {
    return new ApiError('Network error — check your connection and try again.', {
      status: 0,
      code: 'NETWORK',
      cause: err,
    })
  }

  // Programmer error or something thrown synchronously
  return new ApiError(err?.message || 'Unexpected error', {
    status: 0,
    code: 'UNKNOWN',
    cause: err,
  })
}

export function isApiError(err) {
  return err instanceof ApiError
}
