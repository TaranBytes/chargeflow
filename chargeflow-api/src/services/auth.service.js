import { User } from '../models/User.model.js'
import { ApiError } from '../utils/ApiError.js'
import { signAccessToken } from '../utils/jwt.js'
import crypto from 'crypto'
import { env } from '../config/env.js'

export async function signup({ name, email, password, phone }) {
  const existing = await User.findOne({ email: email.toLowerCase() })
  if (existing) throw ApiError.conflict('An account with this email already exists', 'EMAIL_TAKEN')

  const passwordHash = await User.hashPassword(password)
  const user = await User.create({
    name,
    email,
    passwordHash,
    phone,
    avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}&backgroundColor=10b981`,
  })

  const token = signAccessToken({ userId: user.id, role: user.role })
  return { user: user.toJSON(), token }
}

export async function login({ email, password }) {
  // passwordHash has `select: false` — opt back in here.
  const user = await User.findOne({ email: email.toLowerCase() }).select('+passwordHash')
  if (!user) throw ApiError.unauthorized('Invalid email or password', 'INVALID_CREDENTIALS')

  const ok = await user.comparePassword(password)
  if (!ok) throw ApiError.unauthorized('Invalid email or password', 'INVALID_CREDENTIALS')
  if (user.isBlocked) throw ApiError.forbidden('Your account is blocked', 'ACCOUNT_BLOCKED')

  const token = signAccessToken({ userId: user.id, role: user.role })
  return { user: user.toJSON(), token }
}

export async function forgotPassword({ email }) {
  const user = await User.findOne({ email: email.toLowerCase() }).select(
    '+resetPasswordTokenHash +resetPasswordExpiresAt',
  )
  if (!user) {
    // Do not reveal whether an email exists.
    return { ok: true }
  }

  const rawToken = crypto.randomBytes(32).toString('hex')
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex')
  user.resetPasswordTokenHash = tokenHash
  user.resetPasswordExpiresAt = new Date(Date.now() + 15 * 60 * 1000)
  await user.save({ validateBeforeSave: false })

  // Demo-friendly: expose token in non-production so flow is testable.
  return {
    ok: true,
    ...(env.isProd ? {} : { resetToken: rawToken }),
  }
}

export async function resetPassword({ token, newPassword }) {
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex')
  const user = await User.findOne({
    resetPasswordTokenHash: tokenHash,
    resetPasswordExpiresAt: { $gt: new Date() },
  }).select('+resetPasswordTokenHash +resetPasswordExpiresAt')

  if (!user) {
    throw ApiError.badRequest('Reset token is invalid or expired', 'RESET_TOKEN_INVALID')
  }

  user.passwordHash = await User.hashPassword(newPassword)
  user.resetPasswordTokenHash = null
  user.resetPasswordExpiresAt = null
  await user.save({ validateBeforeSave: false })

  return { ok: true }
}
