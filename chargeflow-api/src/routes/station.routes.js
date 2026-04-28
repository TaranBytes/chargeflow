import { Router } from 'express'
import Joi from 'joi'
import { validate } from '../middleware/validate.middleware.js'
import * as stationController from '../controllers/station.controller.js'

const router = Router()

const listQuerySchema = Joi.object({
  search: Joi.string().allow('', null),
  city: Joi.string().allow('', null),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(50),
})

router.get('/', validate(listQuerySchema, 'query'), stationController.listStations)
router.get('/:id', stationController.getStation)
router.get('/:id/chargers', stationController.listChargersForStation)

export default router
