// Wraps an async route handler so we don't have to write try/catch in every controller.
// Any rejection is forwarded to the global error middleware via next().
export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next)
}
