import { ApiError } from '../utils/ApiError.js'

/**
 * Joi validator factory.
 *
 *   router.post('/foo', validate(schema), handler)         // validates req.body
 *   router.get('/foo', validate(schema, 'query'), handler) // validates req.query
 *
 * Successful validation overwrites `req[source]` with the cleaned/coerced value.
 */
export const validate =
  (schema, source = 'body') =>
  (req, _res, next) => {
    const { value, error } = schema.validate(req[source], {
      abortEarly: false,
      stripUnknown: true,
      convert: true,
    })
    if (error) {
      const details = error.details.map((d) => ({
        path: d.path.join('.'),
        message: d.message,
      }))
      return next(ApiError.badRequest('Validation failed', 'VALIDATION', details))
    }
    req[source] = value
    next()
  }
