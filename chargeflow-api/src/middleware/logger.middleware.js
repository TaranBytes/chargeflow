import morgan from 'morgan'
import { env } from '../config/env.js'

// Slim default format in dev, combined in prod. Skip noisy health probes.
const skip = (req) => req.url === '/healthz' || req.url === '/readyz'

export const requestLogger = morgan(env.isProd ? 'combined' : env.logLevel || 'dev', { skip })
