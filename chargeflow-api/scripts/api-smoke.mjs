const BASE_URL = process.env.API_BASE_URL || 'http://localhost:5000'
const EMAIL = `apitest+${Date.now()}@example.com`
const PASSWORD = 'test1234'

let token = ''
const results = []

async function request(name, method, path, body, auth = false) {
  const headers = { 'Content-Type': 'application/json' }
  if (auth && token) headers.Authorization = `Bearer ${token}`

  const response = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  })

  let payload
  try {
    payload = await response.json()
  } catch {
    payload = await response.text()
  }

  results.push({ name, status: response.status, path, payload })
  const verdict = response.ok ? 'PASS' : 'FAIL'
  console.log(`${verdict} ${name} ${response.status} ${path}`)
  return { response, payload }
}

function pickId(value) {
  return value?._id || value?.id || null
}

const health = await request('healthz', 'GET', '/healthz')
if (!health.response.ok) {
  console.error('Health check failed; is backend running?')
  process.exit(1)
}

const signup = await request('signup', 'POST', '/api/auth/signup', {
  name: 'API Test User',
  email: EMAIL,
  password: PASSWORD,
})
token = signup.payload?.data?.token || signup.payload?.token || token

const login = await request('login', 'POST', '/api/auth/login', {
  email: EMAIL,
  password: PASSWORD,
})
token = login.payload?.data?.token || login.payload?.token || token

await request('auth-me', 'GET', '/api/auth/me', null, true)

const stations = await request('stations-list', 'GET', '/api/stations')
const station = stations.payload?.data?.[0]
const stationId = pickId(station)
if (!stationId) {
  console.error('No stations found. Run `npm run seed` first.')
  process.exit(1)
}

const stationDetail = await request('station-detail', 'GET', `/api/stations/${stationId}`)
const chargers = await request('station-chargers', 'GET', `/api/stations/${stationId}/chargers`)

const charger = chargers.payload?.data?.[0] || stationDetail.payload?.data?.chargers?.[0]
const chargerId = pickId(charger)
if (!chargerId) {
  console.error('No chargers found on station.')
  process.exit(1)
}

const bookingStart = new Date(Date.now() + 20 * 60 * 1000).toISOString()
const bookingEnd = new Date(Date.now() + 50 * 60 * 1000).toISOString()
const booking = await request(
  'booking-create',
  'POST',
  '/api/bookings',
  { chargerId, startTime: bookingStart, endTime: bookingEnd },
  true,
)
const bookingId = pickId(booking.payload?.data || booking.payload?.booking || booking.payload)

await request('bookings-my', 'GET', '/api/bookings/my', null, true)

if (bookingId) {
  await request('booking-delete', 'DELETE', `/api/bookings/${bookingId}`, null, true)
}

const started = await request('session-start', 'POST', '/api/sessions/start', { chargerId }, true)
const sessionId = pickId(started.payload?.data || started.payload?.session || started.payload)

await request('session-active', 'GET', '/api/sessions/active', null, true)

if (sessionId) {
  await request('session-stop', 'POST', `/api/sessions/${sessionId}/stop`, {}, true)
}

console.log('\nResults:')
for (const item of results) {
  console.log(`${String(item.status).padStart(3, ' ')} ${item.name}`)
}

const failed = results.filter((item) => item.status >= 400)
if (failed.length > 0) {
  console.error(`\n${failed.length} endpoint checks failed.`)
  process.exit(2)
}

console.log('\nAll endpoint checks passed.')
