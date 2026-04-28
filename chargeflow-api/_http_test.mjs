process.env.MONGO_URI = 'mongodb://127.0.0.1:27017/cf_test'
process.env.JWT_SECRET = 'http_test_secret_at_least_16_chars'
process.env.NODE_ENV = 'test'

const { buildApp } = await import('./src/app.js')
const http = await import('node:http')
const server = http.createServer(buildApp())
await new Promise((r) => server.listen(0, r))
const { port } = server.address()

async function check(method, path, body, token) {
  const headers = { 'Content-Type': 'application/json' }
  if (token) headers.Authorization = `Bearer ${token}`
  const res = await fetch(`http://127.0.0.1:${port}${path}`, {
    method, headers, body: body ? JSON.stringify(body) : undefined,
  })
  const text = await res.text()
  let json
  try { json = JSON.parse(text) } catch { json = text }
  console.log(`${method} ${path} → ${res.status}`, JSON.stringify(json).slice(0, 140))
  return { status: res.status, json }
}

await check('GET', '/healthz')
await check('GET', '/api/stations')          // will 500 (no DB) — checking the error handler's shape
await check('POST', '/api/auth/login', { email: 'bad', password: 'x' })  // 400 validation
await check('GET', '/api/bookings/my')        // 401 missing bearer
await check('GET', '/api/nonexistent-route') // 404 from notFound

server.close()
process.exit(0)
