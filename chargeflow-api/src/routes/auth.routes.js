import { Router } from 'express'
import Joi from 'joi'
import { validate } from '../middleware/validate.middleware.js'
import { protect } from '../middleware/auth.middleware.js'
import * as authController from '../controllers/auth.controller.js'

const router = Router()

const signupSchema = Joi.object({
  name: Joi.string().min(2).max(80).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).max(128).required(),
  phone: Joi.string().allow('', null),
})

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
})

router.post('/signup', validate(signupSchema), authController.signup)
router.post('/login', validate(loginSchema), authController.login)
router.get('/me', protect, authController.me)

export default router
