import { asyncHandler } from '../utils/asyncHandler.js'
import * as authService from '../services/auth.service.js'

export const signup = asyncHandler(async (req, res) => {
  const result = await authService.signup(req.body)
  res.status(201).json({ success: true, data: result })
})

export const login = asyncHandler(async (req, res) => {
  const result = await authService.login(req.body)
  res.json({ success: true, data: result })
})

export const me = asyncHandler(async (req, res) => {
  res.json({ success: true, data: { user: req.user.toJSON() } })
})
