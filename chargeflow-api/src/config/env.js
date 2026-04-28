import dotenv from 'dotenv'
import Joi from 'joi'

dotenv.config()

const schema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
  PORT: Joi.number().default(5000),
  MONGO_URI: Joi.string().required().description('MongoDB connection string'),
  JWT_SECRET: Joi.string().min(16).required(),
  JWT_EXPIRES_IN: Joi.string().default('7d'),
  CLIENT_URL: Joi.string().default('http://localhost:5173'),
  LOG_LEVEL: Joi.string().default('dev'),
}).unknown()

const { value, error } = schema.validate(process.env, { abortEarly: false })

if (error) {
  // Print and exit so misconfiguration fails loud at startup.
  // eslint-disable-next-line no-console
  console.error('[env] Invalid configuration:', error.message)
  process.exit(1)
}

export const env = {
  nodeEnv: value.NODE_ENV,
  isProd: value.NODE_ENV === 'production',
  isDev: value.NODE_ENV === 'development',
  port: Number(value.PORT),
  mongoUri: value.MONGO_URI,
  jwtSecret: value.JWT_SECRET,
  jwtExpiresIn: value.JWT_EXPIRES_IN,
  clientUrl: value.CLIENT_URL,
  // CORS supports a comma-separated list of origins
  corsOrigins: value.CLIENT_URL.split(',').map((s) => s.trim()).filter(Boolean),
  logLevel: value.LOG_LEVEL,
}
