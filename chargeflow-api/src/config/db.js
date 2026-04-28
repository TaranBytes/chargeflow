import mongoose from 'mongoose'
import { env } from './env.js'
import { logger } from '../utils/logger.js'

mongoose.set('strictQuery', true)

export async function connectDB() {
  try {
    await mongoose.connect(env.mongoUri, {
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
}
