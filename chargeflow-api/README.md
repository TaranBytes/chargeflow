# ChargeFlow API

Backend for **ChargeFlow** — EV Charging Station Management System.

Node.js + Express + MongoDB + Socket.io + JWT.

## Quick start (macOS)

### 1. Install Node 20+ via Homebrew + nvm
```bash
brew install nvm
mkdir -p ~/.nvm
echo 'export NVM_DIR="$HOME/.nvm"' >> ~/.zshrc
echo '[ -s "/opt/homebrew/opt/nvm/nvm.sh" ] && . "/opt/homebrew/opt/nvm/nvm.sh"' >> ~/.zshrc
source ~/.zshrc
nvm install --lts
nvm use --lts
```

### 2. MongoDB — pick one

**Option A — Local MongoDB (Homebrew)**
```bash
brew tap mongodb/brew
brew install mongodb-community@7.0
brew services start mongodb-community@7.0
# default URI: mongodb://127.0.0.1:27017/chargeflow
```

**Option B — MongoDB Atlas (cloud, free tier)**
1. Create a free cluster at https://cloud.mongodb.com
2. Create a database user
3. Whitelist your IP (or `0.0.0.0/0` for dev)
4. Copy the connection string and paste it into `.env` as `MONGO_URI`

### 3. Configure & install
```bash
cd chargeflow-api
cp .env.example .env
# edit .env — set MONGO_URI and JWT_SECRET
npm install
```

### 4. Seed the database
```bash
npm run seed          # upsert sample data
npm run seed:reset    # drops collections first, then seeds
```

This creates:
- 2 demo users (`sahib@chargeflow.dev` / `demo@chargeflow.dev`, password `demo1234`)
- 6 stations matching the frontend mock data
- 16 chargers across those stations
- 1 sample upcoming booking

### 5. Run
```bash
npm run dev   # nodemon, hot reload
# or
npm start     # plain node
```

API: http://localhost:5000
Health: http://localhost:5000/healthz
Socket.io: ws://localhost:5000

### 6. Test the API
```bash
# Sign up
curl -X POST http://localhost:5000/api/auth/signup \
  -H 'Content-Type: application/json' \
  -d '{"name":"Test User","email":"test@example.com","password":"test1234"}'

# Log in (use seed credentials)
curl -X POST http://localhost:5000/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"sahib@chargeflow.dev","password":"demo1234"}'

# List stations
curl http://localhost:5000/api/stations

# Get one station with chargers
curl http://localhost:5000/api/stations/<stationId>

# Authenticated: my bookings
TOKEN="<paste-from-login>"
curl http://localhost:5000/api/bookings/my -H "Authorization: Bearer $TOKEN"
```

## Folder structure

```
src/
├── config/       env, db, socket
├── controllers/  thin HTTP handlers
├── models/       Mongoose schemas
├── routes/       per-resource routers + Joi validators
├── middleware/   auth, error, request logger, validate
├── services/     business logic (booking conflicts, sessions)
├── sockets/      Socket.io connection + auth + event emitters
├── utils/        ApiError, asyncHandler, jwt, logger
├── app.js        Express app
└── server.js     HTTP + Socket.io bootstrap
scripts/
└── seed.js       data seeder
```

## API endpoints

| Method | Endpoint | Auth | Notes |
|---|---|---|---|
| POST | `/api/auth/signup` | — | `{ name, email, password }` |
| POST | `/api/auth/login` | — | `{ email, password }` |
| GET | `/api/auth/me` | ✓ | current user |
| GET | `/api/stations` | — | list with pagination + search |
| GET | `/api/stations/:id` | — | single station, populated with chargers |
| GET | `/api/stations/:id/chargers` | — | chargers at station |
| POST | `/api/bookings` | ✓ | conflict-checked, sets charger to RESERVED |
| GET | `/api/bookings/my` | ✓ | current user's bookings |
| DELETE | `/api/bookings/:id` | ✓ | cancel booking; releases charger |
| POST | `/api/sessions/start` | ✓ | start charging — sets OCCUPIED |
| POST | `/api/sessions/:id/stop` | ✓ | stop charging — sets AVAILABLE |
| GET | `/api/sessions/active` | ✓ | current user's active session |

## Real-time events (Socket.io)

Connect with JWT in handshake:
```js
io('http://localhost:5000', { auth: { token } })
```

Server → client:
- `chargerStatusUpdate` — `{ chargerId, stationId, status }`
- `bookingCreated` — `{ booking }`
- `chargingStarted` — `{ session }`
- `chargingStopped` — `{ session }`

## Booking conflict logic

Overlap rule: two intervals `[a, b)` and `[c, d)` overlap iff `a < d` and `b > c`.

Mongo query:
```js
{ charger, status: { $in: ['CONFIRMED','PENDING','IN_PROGRESS'] },
  startTime: { $lt: newEnd },
  endTime:   { $gt: newStart } }
```

If any doc matches → reject with `409 BOOKING_CONFLICT`.
