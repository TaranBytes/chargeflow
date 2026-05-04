import { asyncHandler } from '../utils/asyncHandler.js'
import { ApiError } from '../utils/ApiError.js'
import { verifyAccessToken } from '../utils/jwt.js'
import { User } from '../models/User.model.js'

/**
 * Verifies the Authorization header, attaches `req.user`.
 * Throws 401 on missing/invalid/expired token, or if the user has been deleted.
 */
export const protect = asyncHandler(async (req, _res, next) => {
  const auth = req.headers.authorization || ''
  if (!auth.startsWith('Bearer ')) {
    throw ApiError.unauthorized('Missing bearer token')
  }
  const token = auth.slice(7).trim()
  if (!token) throw ApiError.unauthorized('Missing bearer token')

  let decoded
  try {
    decoded = verifyAccessToken(token)
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      throw ApiError.unauthorized('Session expired, please log in again', 'TOKEN_EXPIRED')
    }
    throw ApiError.unauthorized('Invalid token', 'INVALID_TOKEN')
  }

  const user = await User.findById(decoded.userId)
  if (!user) throw ApiError.unauthorized('User no longer exists', 'USER_GONE')
  if (user.isBlocked) throw ApiError.forbidden('Your account is blocked', 'ACCOUNT_BLOCKED')

  req.user = user
  req.token = token
  next()
})

/**
 * Role guard. Use after `protect`.
 *   router.delete('/foo', protect, requireRole('admin'), handler)
 */
export const requireRole =
  (...roles) =>
  (req, _res, next) => {
    if (!req.user) return next(ApiError.unauthorized())
    if (!roles.includes(req.user.role)) {
      return next(ApiError.forbidden(`Requires role: ${roles.join(', ')}`))
    }
    next()
  }
