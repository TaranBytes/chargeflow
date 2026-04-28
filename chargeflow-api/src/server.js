import http from 'node:http'
import { env } from './config/env.js'
import { connectDB, disconnectDB } from './config/db.js'
import { logger } from './utils/logger.js'
import { buildApp } from './app.js'
import { initSocket } from './sockets/index.js'

async function start() {
  await connectDB()

  const app = buildApp()
  const server = http.createServer(app)
  initSocket(server)

  server.listen(env.port, () => {
    logger.info(`[server] ChargeFlow API listening on http://localhost:${env.port} (${env.nodeEnv})`)
    logger.info(`[server] CORS allowed: ${env.corsOrigins.join(', ')}`)
  })

  // ── Graceful shutdown ─────────────────────────────────────────────────────
  const shutdown = async (signal) => {
    logger.warn(`[server] received ${signal}, shutting down…`)
    server.close(async (err) => {
      if (err) {
        logger.error('[server] error closing http server', err)
        process.exit(1)
      }
      await disconnectDB()
      logger.info('[server] bye 👋')
      process.exit(0)
    })
    // Force-exit after 10s if shutdown stalls
    setTimeout(() => process.exit(1), 10_000).unref()
  }
  process.on('SIGTERM', () => shutdown('SIGTERM'))
  process.on('SIGINT', () => shutdown('SIGINT'))

  process.on('unhandledRejection', (err) => {
    logger.error('[server] unhandledRejection', err)
  })
  process.on('uncaughtException', (err) => {
    logger.error('[server] uncaughtException', err)
    process.exit(1)
  })
}

start().catch((err) => {
  logger.error('[server] fatal startup error', err)
  process.exit(1)
})
