import { Router } from 'express'
import * as chargerController from '../controllers/charger.controller.js'

const router = Router()

router.get('/:id', chargerController.getCharger)

export default router
