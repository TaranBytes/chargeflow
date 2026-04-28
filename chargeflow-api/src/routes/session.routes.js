import { Router } from 'express'
import Joi from 'joi'
import { validate } from '../middleware/validate.middleware.js'
import { protect } from '../middleware/auth.middleware.js'
import * as sessionController from '../controllers/session.controller.js'

const router = Router()

const startSchema = Joi.object({
  chargerId: Joi.string().hex().length(24).required(),
  bookingId: Joi.string().hex().length(24).optional(),
})

const stopSchema = Joi.object({
  energyConsumed: Joi.number().min(0).optional(),
})

router.post('/start', protect, validate(startSchema), sessionController.startSession)
router.post('/:id/stop', protect, validate(stopSchema), sessionController.stopSession)
router.get('/active', protect, sessionController.activeSession)

export default router
