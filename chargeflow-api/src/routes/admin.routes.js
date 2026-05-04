import { Router } from 'express'
import Joi from 'joi'
import * as adminController from '../controllers/admin.controller.js'
import { protect, requireRole } from '../middleware/auth.middleware.js'
import { validate } from '../middleware/validate.middleware.js'

const router = Router()

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
})

const stationSchema = Joi.object({
  name: Joi.string().trim().min(2).max(120).required(),
  address: Joi.string().trim().min(3).max(200).required(),
  lat: Joi.number().min(-90).max(90).required(),
  lng: Joi.number().min(-180).max(180).required(),
  pricingPerKWh: Joi.number().min(0).required(),
  status: Joi.string().valid('active', 'maintenance', 'offline').default('active'),
})

const updateStationSchema = Joi.object({
  name: Joi.string().trim().min(2).max(120),
  address: Joi.string().trim().min(3).max(200),
  lat: Joi.number().min(-90).max(90),
  lng: Joi.number().min(-180).max(180),
  pricingPerKWh: Joi.number().min(0),
  status: Joi.string().valid('active', 'maintenance', 'offline'),
})

const idParamSchema = Joi.object({
  id: Joi.string().required(),
})

const chargerUpdateSchema = Joi.object({
  type: Joi.string().valid('AC', 'DC', 'Fast'),
  power: Joi.number().min(1),
  status: Joi.string().valid('available', 'charging', 'faulty'),
  isEnabled: Joi.boolean(),
})

const blockUserSchema = Joi.object({
  blocked: Joi.boolean(),
})

const revenueQuerySchema = Joi.object({
  days: Joi.number().integer().min(1).max(365).default(7),
})

router.post('/login', validate(loginSchema), adminController.adminLogin)

router.use(protect, requireRole('admin'))

router.get('/stations', adminController.listStations)
router.post('/stations', validate(stationSchema), adminController.createStation)
router.put('/stations/:id', validate(idParamSchema, 'params'), validate(updateStationSchema), adminController.updateStation)
router.delete('/stations/:id', validate(idParamSchema, 'params'), adminController.deleteStation)

router.get('/chargers', adminController.listChargers)
router.put('/chargers/:id', validate(idParamSchema, 'params'), validate(chargerUpdateSchema), adminController.updateCharger)
router.patch('/chargers/:id/toggle', validate(idParamSchema, 'params'), adminController.toggleCharger)

router.get('/sessions', adminController.listSessions)
router.get('/sessions/active', adminController.listActiveSessions)

router.get('/users', adminController.listUsers)
router.patch('/users/:id/block', validate(idParamSchema, 'params'), validate(blockUserSchema), adminController.toggleUserBlock)

router.get('/revenue/summary', adminController.revenueSummary)
router.get('/revenue/timeseries', validate(revenueQuerySchema, 'query'), adminController.revenueTimeseries)

router.get('/alerts', adminController.listAlerts)

export default router
