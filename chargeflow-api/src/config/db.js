
import mongoose from 'mongoose'
import { env } from './env.js'
import { logger } from '../utils/logger.js'

mongoose.set('strictQuery', true)

let memoryServer = null
let usingMemoryServer = false

/**
 * Resolve the Mongo URI we should connect to.
 *  - If MONGO_URI is set → use it as-is (real Mongo / Atlas / etc.)
 *  - Otherwise (dev/test only) → spin up an in-memory MongoDB via
 *    mongodb-memory-server. Useful for Codespaces and machines without
 *    a local Mongo installed. Production is blocked by env.js.
 */
async function resolveMongoUri() {
  if (env.mongoUri) return env.mongoUri

  logger.warn('[db] MONGO_URI not set — booting an in-memory MongoDB (development fallback)')
  // Lazy import keeps this dep optional in production deployments.
  const { MongoMemoryServer } = await import('mongodb-memory-server')
  // The library picks a sensible default Mongo binary for the host arch.
  // If your platform needs a specific build, set MONGOMS_VERSION in .env (e.g. "7.0.14").
  const version = process.env.MONGOMS_VERSION || undefined
  memoryServer = await MongoMemoryServer.create({
    instance: { dbName: 'chargeflow' },
    ...(version ? { binary: { version } } : {}),
  })
  usingMemoryServer = true
  const uri = memoryServer.getUri()
  logger.info(`[db] in-memory MongoDB ready at ${uri}`)
  return uri
}

export async function connectDB() {
  try {
    const uri = await resolveMongoUri()
    await mongoose.connect(uri, {
      autoIndex: !env.isProd,
      serverSelectionTimeoutMS: 8000,
    })
    logger.info(`[db] connected: ${mongoose.connection.host}/${mongoose.connection.name}`)

    mongoose.connection.on('disconnected', () => logger.warn('[db] disconnected'))
    mongoose.connection.on('reconnected', () => logger.info('[db] reconnected'))
    mongoose.connection.on('error', (e) => logger.error('[db] error', e))
  } catch (err) {
    logger.error('[db] connection failed', err)
    process.exit(1)
  }
}

export async function disconnectDB() {
  await mongoose.connection.close()
  if (memoryServer) {
    await memoryServer.stop()
    memoryServer = null
    usingMemoryServer = false
  }
}

export function isMemoryServer() {
  return usingMemoryServer
}
