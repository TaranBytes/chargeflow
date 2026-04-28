import { ApiError } from '../utils/ApiError.js'
import { logger } from '../utils/logger.js'
import { env } from '../config/env.js'

// 404 handler for unknown routes — chains into errorHandler.
export function notFound(req, _res, next) {
  next(ApiError.notFound(`Route not found: ${req.method} ${req.originalUrl}`))
}

// Global error handler — translates anything thrown into a clean JSON response.
// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, _next) {
  let status = err.statusCode || 500
  let message = err.message || 'Internal server error'
  let code = err.code || 'INTERNAL_ERROR'
  let details = err.details || null

  // Mongoose validation
  if (err.name === 'ValidationError') {
    status = 400
    code = 'VALIDATION'
    details = Object.values(err.errors || {}).map((e) => e.message)
    message = 'Validation failed'
  }

  // Bad ObjectId etc.
  if (err.name === 'CastError') {
    status = 400
    code = 'INVALID_ID'
    message = `Invalid value for field "${err.path}"`
  }

  // Duplicate key
  if (err.code === 11000) {
    status = 409
    code = 'DUPLICATE'
    const key = Object.keys(err.keyPattern || err.keyValue || {})[0]
    message = key ? `Duplicate value for "${key}"` : 'Duplicate key'
    details = err.keyValue
  }

  // JWT
  if (err.name === 'JsonWebTokenError') {
    status = 401
    code = 'INVALID_TOKEN'
    message = 'Invalid token'
  }
  if (err.name === 'TokenExpiredError') {
    status = 401
    code = 'TOKEN_EXPIRED'
    message = 'Token expired'
  }

  // Log 5xx loudly, 4xx quietly.
  if (status >= 500) {
    logger.error(`[${req.method} ${req.originalUrl}]`, err.stack || err)
  } else {
    logger.warn(`[${req.method} ${req.originalUrl}] ${status} ${code} — ${message}`)
  }

  res.status(status).json({
    success: false,
    error: {
      code,
      message,
      ...(details ? { details } : {}),
      ...(env.isDev && status >= 500 ? { stack: err.stack } : {}),
    },
  })
}
