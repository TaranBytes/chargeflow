import { User } from '../models/User.model.js'
import { ApiError } from '../utils/ApiError.js'
import { signAccessToken } from '../utils/jwt.js'

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

  const token = signAccessToken({ userId: user.id, role: user.role })
  return { user: user.toJSON(), token }
}
