import { Router } from 'express'
import authRoutes from './auth.routes.js'
import stationRoutes from './station.routes.js'
import chargerRoutes from './charger.routes.js'
import bookingRoutes from './booking.routes.js'
import sessionRoutes from './session.routes.js'

const router = Router()

router.use('/auth', authRoutes)
router.use('/stations', stationRoutes)
router.use('/chargers', chargerRoutes)
router.use('/bookings', bookingRoutes)
router.use('/sessions', sessionRoutes)

export default router
