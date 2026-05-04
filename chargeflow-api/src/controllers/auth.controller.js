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

export const addVehicle = asyncHandler(async (req, res) => {
  const vehicle = {
    make: req.body.make,
    model: req.body.model,
    batteryKWh: req.body.batteryKWh,
    connectorType: req.body.connectorType,
  }
  req.user.vehicles = [...(req.user.vehicles || []), vehicle]
  await req.user.save()

  res.status(201).json({
    success: true,
    data: {
      user: req.user.toJSON(),
      vehicle,
    },
  })
})

export const removeVehicle = asyncHandler(async (req, res) => {
  const vehicleIndex = Number(req.params.index)
  if (!Array.isArray(req.user.vehicles) || vehicleIndex < 0 || vehicleIndex >= req.user.vehicles.length) {
    return res.status(404).json({
      success: false,
      message: 'Vehicle not found',
    })
  }

  req.user.vehicles.splice(vehicleIndex, 1)
  await req.user.save()

  res.json({
    success: true,
    data: {
      user: req.user.toJSON(),
    },
  })
})

export const forgotPassword = asyncHandler(async (req, res) => {
  const result = await authService.forgotPassword(req.body)
  res.json({
    success: true,
    data: result,
    message: 'If that email is registered, a reset link has been sent.',
  })
})

export const resetPassword = asyncHandler(async (req, res) => {
  const result = await authService.resetPassword(req.body)
  res.json({
    success: true,
    data: result,
    message: 'Password reset successful. Please sign in.',
  })
})
