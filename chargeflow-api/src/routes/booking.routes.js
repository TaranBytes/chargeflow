import { Router } from 'express'
import Joi from 'joi'
import { validate } from '../middleware/validate.middleware.js'
import { protect } from '../middleware/auth.middleware.js'
import * as bookingController from '../controllers/booking.controller.js'

const router = Router()

const createSchema = Joi.object({
  chargerId: Joi.string().hex().length(24).required(),
  startTime: Joi.date().iso().required(),
  endTime: Joi.date().iso().greater(Joi.ref('startTime')).required(),
  estimatedKWh: Joi.number().min(0).default(0),
  estimatedCost: Joi.number().min(0).default(0),
})

router.post('/', protect, validate(createSchema), bookingController.createBooking)
router.get('/my', protect, bookingController.myBookings)
router.delete('/:id', protect, bookingController.cancelBooking)
// Backward-compat with the frontend's PATCH /:id/cancel endpoint
router.patch('/:id/cancel', protect, bookingController.cancelBooking)

export default router
