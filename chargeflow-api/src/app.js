import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import compression from 'compression'
import rateLimit from 'express-rate-limit'

import { env } from './config/env.js'
import { requestLogger } from './middleware/logger.middleware.js'
import { errorHandler, notFound } from './middleware/error.middleware.js'
import routes from './routes/index.js'

export function buildApp() {
  const app = express()

  // ── Trust proxy so rate-limit and req.ip work behind nginx/ELB ───────────
  app.set('trust proxy', 1)

  // ── Security & parsing ───────────────────────────────────────────────────
  app.use(helmet())
  app.use(
    cors({
      origin: (origin, cb) => {
        // allow no-origin (curl, server-to-server) and any whitelisted origin
        if (!origin || env.corsOrigins.includes(origin)) return cb(null, true)
        cb(new Error(`CORS: origin not allowed: ${origin}`))
      },
      credentials: true,
    }),
  )
  app.use(express.json({ limit: '1mb' }))
  app.use(express.urlencoded({ extended: true }))
  app.use(compression())
  app.use(requestLogger)

  // ── Auth-route rate limit ────────────────────────────────────────────────
  app.use(
    '/api/auth',
    rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 50,
      standardHeaders: true,
      legacyHeaders: false,
      message: { success: false, error: { code: 'RATE_LIMITED', message: 'Too many requests, slow down.' } },
    }),
  )

  // ── Health probes ────────────────────────────────────────────────────────
  app.get('/healthz', (_req, res) => res.json({ ok: true, ts: Date.now() }))
  app.get('/readyz', (_req, res) => res.json({ ok: true }))

  // ── API ──────────────────────────────────────────────────────────────────
  app.use('/api', routes)

  // ── 404 + error handler ──────────────────────────────────────────────────
  app.use(notFound)
  app.use(errorHandler)

  return app
}
