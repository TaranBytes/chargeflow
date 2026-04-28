process.env.MONGO_URI = 'mongodb://127.0.0.1:27017/cf_smoke'
process.env.JWT_SECRET = 'smoke_test_secret_at_least_16_chars'
process.env.CLIENT_URL = 'http://localhost:5173'
process.env.NODE_ENV = 'test'

const { buildApp } = await import('./src/app.js')
const { initSocket } = await import('./src/sockets/index.js')
const { signAccessToken } = await import('./src/utils/jwt.js')
const { ApiError } = await import('./src/utils/ApiError.js')
const http = await import('node:http')

const app = buildApp()
const server = http.createServer(app)
initSocket(server)

// Print the registered routes so we can confirm the API surface
function printRoutes(stack, prefix = '') {
  for (const layer of stack) {
    if (layer.route) {
      const methods = Object.keys(layer.route.methods).map((m) => m.toUpperCase()).join(',')
      console.log(`  ${methods.padEnd(10)} ${prefix}${layer.route.path}`)
    } else if (layer.name === 'router' && layer.handle.stack) {
      const m = layer.regexp?.toString().match(/\/\^\\\/(.*?)\\\//)
      const sub = m ? '/' + m[1].replace(/\\\//g, '/') : ''
      printRoutes(layer.handle.stack, prefix + sub)
    }
  }
}
console.log('Registered routes:')
printRoutes(app._router.stack)

console.log('\nJWT round-trip:', !!signAccessToken({ userId: 'u1', role: 'user' }))
console.log('ApiError factory:', new ApiError(404, 'x').statusCode === 404)
console.log('\nApp boot OK ✅')
process.exit(0)
