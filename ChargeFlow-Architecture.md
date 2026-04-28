# ChargeFlow — System Design & Architecture

> Production-ready blueprint for the EV Charging Station Management System.
> Stack: React (Vite) + Tailwind + React-Leaflet on the client; Node.js + Express + MongoDB + Socket.io on the server; OCPP-ready integration layer.

---

## 1. System Architecture

ChargeFlow is a layered, service-oriented system optimized for real-time data, public deployment, and future hardware integration.

### 1.1 Logical Layers

**Presentation Layer (Client)**
- React + Vite single-page app
- Tailwind CSS for styling
- React Router for navigation
- React-Leaflet (OpenStreetMap tiles) for the map
- Axios for HTTP, Socket.io client for WebSockets

**Application Layer (Backend API)**
- Express.js REST API (stateless)
- Socket.io server for real-time
- JWT-based auth middleware
- Service layer holding business logic
- Validation layer (Joi or Zod)

**Persistence Layer**
- MongoDB primary store via Mongoose ODM
- Redis for: Socket.io adapter (multi-instance fan-out), live charger-status cache, rate-limit counters, JWT denylist, BullMQ job queue

**Integration Layer**
- OCPP Gateway — separate Node service speaking OCPP 1.6/2.0.1 over WebSocket to physical chargers
- Notification service (email/SMS/push hooks)
- Payment gateway hook (future)

**Infrastructure Layer**
- Nginx as reverse proxy / TLS terminator / WebSocket upgrade
- PM2 / Docker / Kubernetes for orchestration
- Cloud (AWS/GCP/Azure) with managed Mongo (Atlas) and Redis

### 1.2 Component Diagram

```
                        ┌──────────────────────────────┐
                        │       React Client           │
                        │ (Vite + Tailwind + Leaflet)  │
                        └──────────────┬───────────────┘
                                       │ HTTPS REST
                                       │ WSS (Socket.io)
                                       ▼
                              ┌──────────────────┐
                              │   Nginx (LB/TLS) │
                              └────────┬─────────┘
                                       │
                ┌──────────────────────┼──────────────────────┐
                ▼                      ▼                      ▼
       ┌──────────────────┐  ┌──────────────────┐   ┌──────────────────┐
       │  Express API     │  │  Socket.io       │   │  OCPP Gateway    │
       │  (stateless)     │  │  Server          │   │  (WebSocket srv) │
       └────────┬─────────┘  └────────┬─────────┘   └────────┬─────────┘
                │                     │                       │
                ▼                     ▼                       ▼
            ┌─────────────────────────────────────────────────────┐
            │        Redis (Pub/Sub + Cache + Adapter)            │
            └─────────────────────────────────────────────────────┘
                                  │
                                  ▼
                          ┌──────────────────┐
                          │   MongoDB        │
                          │ (replica set)    │
                          └──────────────────┘
                                  ▲
                                  │ OCPP (wss://)
                          ┌──────────────────┐
                          │ Physical / Sim   │
                          │ Chargers         │
                          └──────────────────┘
```

### 1.3 Why this shape

- **Stateless API** → trivial horizontal scaling
- **Separated OCPP gateway** → hardware concerns are isolated and can scale independently from the user-facing API
- **Redis** → glue for clustering, pub/sub, and hot reads
- **MongoDB with 2dsphere** → flexible schema for evolving station/charger metadata and fast geo queries

---

## 2. High-Level Data Flow

### 2.1 User searches for stations

1. User opens the map page; React requests browser geolocation.
2. Frontend calls `GET /api/stations/nearby?lat=...&lng=...&radius=5`.
3. Backend runs MongoDB `$geoNear` against the `2dsphere` index on `Station.location`.
4. Each result includes a charger summary (count available, types, max power).
5. Map renders markers; color reflects availability.
6. For each visible station, the client emits `subscribe:station` so it gets live updates while the marker is on screen.

### 2.2 Booking flow

1. User taps a marker → `GET /api/stations/:id` for full detail with chargers populated.
2. User selects charger + time slot → `POST /api/bookings`.
3. Backend (inside a Mongo transaction): authenticates JWT, validates input, checks for overlapping bookings on that charger, creates `Booking` with `status: PENDING`.
4. Backend emits `booking:created` to `user:<id>` and `charger:reserved` to `station:<id>`.
5. Frontend receives confirmation and updates UI.
6. Background job auto-expires `PENDING` bookings that aren't paid/started in N minutes.

### 2.3 Real-time updates

1. After login, the client opens a Socket.io connection with the JWT in the handshake.
2. Server middleware verifies the token, attaches `socket.user`, joins `user:<id>` and `role:<role>`.
3. Client subscribes to rooms relevant to what's on screen (`station:<id>`, `session:<id>`).
4. Backend (or OCPP gateway via Redis pub/sub) broadcasts events; Redis adapter fans them out across all API instances.

### 2.4 Charging session lifecycle

1. User arrives, plugs in. The charger sends OCPP `Authorize` then `StartTransaction` to the gateway.
2. Gateway validates against an active booking, creates a `ChargingSession`, links it to the booking, emits `session:started`.
3. `MeterValues` arrive every N seconds → session metrics updated → `session:tick` broadcast (kWh, power, cost, optional SoC).
4. User unplugs → `StopTransaction` → session closed, final cost computed, `session:ended` broadcast, booking marked `COMPLETED`.
5. Receipt persisted; analytics counters updated.

---

## 3. API Design

All endpoints are JSON over HTTPS, prefixed with `/api`. Auth is `Authorization: Bearer <accessToken>` unless stated. Errors follow `{ error: { code, message, details? } }`.

### 3.1 Authentication

| Method | Endpoint | Body | Response | Auth |
|---|---|---|---|---|
| POST | `/api/auth/register` | `{ name, email, password, phone }` | `201 { user, accessToken, refreshToken }` | public |
| POST | `/api/auth/login` | `{ email, password }` | `200 { user, accessToken, refreshToken }` | public |
| POST | `/api/auth/refresh` | `{ refreshToken }` | `{ accessToken, refreshToken }` | public |
| POST | `/api/auth/logout` | — | `204` | user |
| GET  | `/api/auth/me` | — | `{ user }` | user |
| POST | `/api/auth/forgot-password` | `{ email }` | `204` | public |
| POST | `/api/auth/reset-password` | `{ token, newPassword }` | `204` | public |

### 3.2 Stations

| Method | Endpoint | Body / Query | Response | Auth |
|---|---|---|---|---|
| GET | `/api/stations` | `?page=&limit=&search=&city=` | `{ data: [...], total, page }` | public |
| GET | `/api/stations/nearby` | `?lat=&lng=&radius=&types=` | `{ data: [...] }` | public |
| GET | `/api/stations/:id` | — | `{ station, chargers }` | public |
| POST | `/api/stations` | `{ name, address, location:{type:'Point',coordinates:[lng,lat]}, operatingHours, amenities }` | `201 { station }` | admin / operator |
| PUT | `/api/stations/:id` | partial fields | `{ station }` | admin / operator |
| DELETE | `/api/stations/:id` | — | `204` | admin |

### 3.3 Chargers

| Method | Endpoint | Body / Query | Response | Auth |
|---|---|---|---|---|
| GET | `/api/stations/:stationId/chargers` | — | `[ charger ]` | public |
| GET | `/api/chargers/:id` | — | `{ charger, currentSession? }` | public |
| POST | `/api/chargers` | `{ stationId, ocppId, type, connectorType, powerKW, pricePerKWh }` | `201 { charger }` | admin / operator |
| PUT | `/api/chargers/:id` | partial | `{ charger }` | admin / operator |
| PATCH | `/api/chargers/:id/status` | `{ status }` | `{ charger }` | internal (OCPP) |
| DELETE | `/api/chargers/:id` | — | `204` | admin |

### 3.4 Bookings

| Method | Endpoint | Body / Query | Response | Auth |
|---|---|---|---|---|
| POST | `/api/bookings` | `{ chargerId, startTime, endTime, estimatedKWh }` | `201 { booking }` | user |
| GET | `/api/bookings` | `?status=&from=&to=` (admin: also `userId`) | `{ data, total }` | user / admin |
| GET | `/api/bookings/:id` | — | `{ booking }` | owner / admin |
| PATCH | `/api/bookings/:id/cancel` | — | `{ booking }` | owner |
| PATCH | `/api/bookings/:id/confirm` | — | `{ booking }` | user (after payment) |
| GET | `/api/users/me/bookings` | — | `[ booking ]` | user |

### 3.5 Sessions

| Method | Endpoint | Body / Query | Response | Auth |
|---|---|---|---|---|
| POST | `/api/sessions/start` | `{ bookingId, chargerId, ocppTxnId, meterStart }` | `{ session }` | internal (OCPP) |
| POST | `/api/sessions/:id/tick` | `{ energyWh, powerW, soc? }` | `204` | internal (OCPP) |
| POST | `/api/sessions/:id/stop` | `{ meterEnd, stopReason }` | `{ session, finalCost }` | internal (OCPP) or owner |
| GET | `/api/sessions/:id` | — | `{ session }` | owner / admin |
| GET | `/api/sessions/active` | — | `{ session }` | user |
| GET | `/api/users/me/sessions` | `?from=&to=` | `[ session ]` | user |

---

## 4. Database Design (MongoDB / Mongoose)

### 4.1 User

```
{
  _id: ObjectId,
  name: String,
  email: String,            // unique, indexed, lowercased
  passwordHash: String,
  phone: String,
  role: 'user' | 'operator' | 'admin',  // default 'user'
  vehicles: [{
    make: String, model: String,
    batteryKWh: Number,
    connectorType: 'Type2'|'CCS'|'CHAdeMO'|'Tesla'
  }],
  paymentMethods: [{ provider, last4, tokenRef }],
  refreshTokenHashes: [String],
  emailVerifiedAt: Date,
  createdAt, updatedAt
}
```
Indexes: `email` unique.

### 4.2 Station

```
{
  _id, name, description,
  address: { line1, line2, city, state, country, postalCode },
  location: { type: 'Point', coordinates: [lng, lat] },   // 2dsphere
  operator: ObjectId(ref: User),
  amenities: [String],
  operatingHours: {
    mon: { open, close }, tue: { ... }, ..., sun: { ... }
  },
  totalChargers: Number,           // denormalized
  availableChargers: Number,       // denormalized, updated via socket events
  status: 'ACTIVE'|'MAINTENANCE'|'INACTIVE',
  images: [String],
  rating: Number,
  createdAt, updatedAt
}
```
Indexes: `2dsphere` on `location`; text index on `name + address.city`.

### 4.3 Charger

```
{
  _id,
  station: ObjectId(ref: Station),     // indexed
  ocppId: String,                       // unique chargePoint identifier
  connectorId: Number,                  // OCPP connector id (1..n)
  type: 'AC'|'DC',
  connectorType: 'Type2'|'CCS'|'CHAdeMO'|'Tesla',
  powerKW: Number,
  pricePerKWh: Number,
  status: 'AVAILABLE'|'RESERVED'|'OCCUPIED'|'OFFLINE'|'FAULTED',
  currentSession: ObjectId(ref: Session) | null,
  lastHeartbeat: Date,
  firmwareVersion: String,
  createdAt, updatedAt
}
```
Indexes: `{ station: 1 }`, `{ ocppId: 1 } unique`.

### 4.4 Booking

```
{
  _id,
  user: ObjectId(ref: User),
  charger: ObjectId(ref: Charger),
  station: ObjectId(ref: Station),
  startTime: Date,
  endTime: Date,
  estimatedKWh: Number,
  estimatedCost: Number,
  status: 'PENDING'|'CONFIRMED'|'IN_PROGRESS'|'COMPLETED'|'CANCELLED'|'EXPIRED',
  paymentStatus: 'UNPAID'|'PAID'|'REFUNDED',
  session: ObjectId(ref: Session) | null,
  cancelReason: String,
  createdAt, updatedAt
}
```
Indexes: `{ charger: 1, startTime: 1, endTime: 1 }`, `{ user: 1, createdAt: -1 }`.

### 4.5 ChargingSession

```
{
  _id,
  booking: ObjectId(ref: Booking),
  user: ObjectId,
  charger: ObjectId,
  station: ObjectId,
  ocppTxnId: Number,
  startTime: Date,
  endTime: Date | null,
  meterStart: Number,        // Wh
  meterEnd: Number | null,
  energyDeliveredKWh: Number,
  cost: Number,
  status: 'ACTIVE'|'COMPLETED'|'INTERRUPTED'|'FAULTED',
  meterReadings: [{
    ts: Date, energyWh: Number, powerW: Number, soc: Number
  }],
  stopReason: String,
  createdAt, updatedAt
}
```
Indexes: `{ user: 1, status: 1 }`, `{ charger: 1, startTime: -1 }`.

> When traffic grows, move `meterReadings` into a Mongo time-series collection keyed by `chargerId`.

### 4.6 Relationships

- `User 1—N Booking`, `User 1—N ChargingSession`
- `Station 1—N Charger`
- `Charger 1—N Booking`, `Charger 1—N ChargingSession`, `Charger 1—1 currentSession`
- `Booking 1—1 ChargingSession`

---

## 5. Folder Structure

### 5.1 Frontend (`chargeflow-web/`)

```
chargeflow-web/
├── public/
├── src/
│   ├── api/                    # axios wrappers per resource
│   │   ├── client.js
│   │   ├── auth.api.js
│   │   ├── station.api.js
│   │   ├── charger.api.js
│   │   ├── booking.api.js
│   │   └── session.api.js
│   ├── assets/
│   ├── components/
│   │   ├── common/             # Button, Modal, Spinner, Toast
│   │   ├── map/                # MapView, StationMarker, AvailabilityLegend
│   │   ├── station/            # StationCard, StationDetail, ChargerList
│   │   ├── charger/            # ChargerCard, StatusBadge, SlotPicker
│   │   ├── booking/            # BookingForm, BookingList, BookingItem
│   │   └── session/            # LiveSessionPanel, MeterChart
│   ├── context/                # AuthContext, SocketContext, ThemeContext
│   ├── hooks/
│   │   ├── useAuth.js
│   │   ├── useSocket.js
│   │   ├── useGeolocation.js
│   │   ├── useStations.js
│   │   └── useLiveSession.js
│   ├── layouts/
│   │   ├── PublicLayout.jsx
│   │   ├── AppLayout.jsx
│   │   └── AdminLayout.jsx
│   ├── pages/
│   │   ├── Auth/               # Login, Register, Forgot
│   │   ├── Map/                # MapPage (default landing)
│   │   ├── Stations/           # StationDetailPage
│   │   ├── Bookings/           # MyBookingsPage, BookingDetailPage
│   │   ├── Sessions/           # ActiveSessionPage, HistoryPage
│   │   └── Admin/              # StationAdmin, ChargerAdmin, Dashboard
│   ├── routes/
│   │   ├── AppRoutes.jsx
│   │   ├── ProtectedRoute.jsx
│   │   └── RoleRoute.jsx
│   ├── services/
│   │   ├── socket.service.js
│   │   ├── auth.service.js
│   │   └── storage.service.js
│   ├── store/                  # zustand slices (optional)
│   ├── utils/                  # formatters, constants, validators
│   ├── styles/                 # tailwind base, custom CSS
│   ├── App.jsx
│   └── main.jsx
├── .env.example
├── tailwind.config.js
├── vite.config.js
└── package.json
```

### 5.2 Backend (`chargeflow-api/`)

```
chargeflow-api/
├── src/
│   ├── config/
│   │   ├── env.js              # loads + validates env vars
│   │   ├── db.js               # mongoose connection
│   │   ├── redis.js
│   │   └── socket.js           # Socket.io bootstrap + adapter
│   ├── models/
│   │   ├── User.model.js
│   │   ├── Station.model.js
│   │   ├── Charger.model.js
│   │   ├── Booking.model.js
│   │   └── Session.model.js
│   ├── controllers/
│   │   ├── auth.controller.js
│   │   ├── station.controller.js
│   │   ├── charger.controller.js
│   │   ├── booking.controller.js
│   │   └── session.controller.js
│   ├── services/               # business logic, no req/res
│   │   ├── auth.service.js
│   │   ├── station.service.js
│   │   ├── charger.service.js
│   │   ├── booking.service.js
│   │   ├── session.service.js
│   │   ├── pricing.service.js
│   │   └── notification.service.js
│   ├── routes/
│   │   ├── index.js
│   │   ├── auth.routes.js
│   │   ├── station.routes.js
│   │   ├── charger.routes.js
│   │   ├── booking.routes.js
│   │   └── session.routes.js
│   ├── middleware/
│   │   ├── auth.middleware.js   # JWT verify, attach req.user
│   │   ├── role.middleware.js   # requireRole(['admin'])
│   │   ├── error.middleware.js  # central error handler
│   │   ├── validate.middleware.js
│   │   └── rateLimit.middleware.js
│   ├── validators/              # Joi/Zod schemas per resource
│   ├── sockets/
│   │   ├── index.js
│   │   ├── handlers/
│   │   │   ├── booking.socket.js
│   │   │   ├── station.socket.js
│   │   │   └── session.socket.js
│   │   └── middleware/
│   │       └── socketAuth.js
│   ├── ocpp/                    # gateway module (or split out as own service)
│   │   ├── server.js            # ws server, connection registry
│   │   ├── handlers/
│   │   │   ├── boot.handler.js
│   │   │   ├── heartbeat.handler.js
│   │   │   ├── statusNotification.handler.js
│   │   │   ├── authorize.handler.js
│   │   │   ├── startTransaction.handler.js
│   │   │   ├── meterValues.handler.js
│   │   │   └── stopTransaction.handler.js
│   │   ├── outbound/            # remoteStart/Stop/Reset commands
│   │   └── ocpp.types.js
│   ├── jobs/
│   │   ├── expireBookings.job.js
│   │   ├── chargerHeartbeatCheck.job.js
│   │   └── dailyAggregation.job.js
│   ├── utils/
│   │   ├── logger.js
│   │   ├── pricing.js
│   │   ├── geo.js
│   │   └── tokens.js
│   ├── app.js                   # express app
│   └── server.js                # boots http + socket + ocpp
├── tests/
├── docs/postman/
├── .env.example
├── package.json
└── README.md
```

---

## 6. Real-Time Architecture

### 6.1 Connection lifecycle

- Client: `io(SOCKET_URL, { auth: { token } })`
- Server middleware verifies the JWT, attaches `socket.user`, auto-joins `user:<id>` and `role:<role>`.
- On disconnect, room cleanup is automatic.

### 6.2 Rooms

- `user:<userId>` — personal events (booking confirmations, notifications)
- `station:<stationId>` — anyone watching that station's marker/detail
- `charger:<chargerId>` — granular charger updates
- `session:<sessionId>` — live telemetry for an in-progress charge
- `admin` — operator dashboards

### 6.3 Server → Client events

| Event | Payload | Sent to |
|---|---|---|
| `charger:status` | `{ chargerId, status }` | `charger:<id>`, `station:<id>` |
| `station:availability` | `{ stationId, available, total }` | `station:<id>` |
| `booking:created` | `{ booking }` | `user:<id>`, `admin` |
| `booking:update` | `{ booking }` | `user:<id>` |
| `session:started` | `{ session }` | `user:<id>`, `session:<id>` |
| `session:tick` | `{ sessionId, kWh, powerW, cost, soc? }` | `session:<id>` |
| `session:ended` | `{ session, finalCost }` | `user:<id>`, `session:<id>` |
| `notification` | `{ type, message }` | `user:<id>` |

### 6.4 Client → Server events

| Event | Payload |
|---|---|
| `subscribe:station` | `{ stationId }` |
| `unsubscribe:station` | `{ stationId }` |
| `subscribe:session` | `{ sessionId }` |
| `unsubscribe:session` | `{ sessionId }` |
| `ping` | — |

### 6.5 Multi-instance scaling

- `@socket.io/redis-adapter` so all API instances share rooms via Redis pub/sub.
- Sticky sessions enabled at the load balancer (or disable polling fallback).
- Server-side authorization on every `subscribe:*` (e.g., a user can only subscribe to their own session).

---

## 7. OCPP Integration Plan

### 7.1 What OCPP is in this system

OCPP (Open Charge Point Protocol) is the open standard between a charging station ("charge point") and a Charging Station Management System (CSMS — that's ChargeFlow). 1.6 uses JSON-over-WebSocket; 2.0.1 adds richer messaging. We'll target 1.6J for v1 and design types to be forward-compatible with 2.0.1.

### 7.2 Where OCPP lives in the architecture

- A dedicated **OCPP Gateway** service runs as a WebSocket server, e.g. `wss://ocpp.chargeflow.com/ocpp/<chargerId>`.
- Each physical charger maintains a persistent WebSocket connection to this gateway.
- The gateway authenticates the charger (token in the WS upgrade headers, or mTLS) and translates OCPP messages into internal events on **Redis pub/sub**.
- The API and Socket.io servers subscribe to those events and update Mongo + broadcast to clients.
- The gateway is **stateless** — connection registry lives in Redis.

### 7.3 Inbound message handling (charger → CSMS)

| OCPP message | What we do |
|---|---|
| `BootNotification` | Upsert charger record, return current time + heartbeat interval |
| `Heartbeat` | Update `lastHeartbeat` |
| `StatusNotification` | Update `Charger.status` → emit `charger:status` |
| `Authorize` | Validate user/RFID against an active booking |
| `StartTransaction` | Create `ChargingSession`, link booking → emit `session:started` |
| `MeterValues` | Append meter reading, recompute kWh/cost → emit `session:tick` |
| `StopTransaction` | Finalize session, settle cost → emit `session:ended`, mark booking `COMPLETED` |
| `DataTransfer` | Reserved for vendor-specific extensions |

### 7.4 Outbound commands (CSMS → charger)

- `RemoteStartTransaction` — when user taps "Start" remotely
- `RemoteStopTransaction`
- `Reset`
- `ChangeConfiguration`
- `UnlockConnector`

These are issued through a service method on the API side that publishes an internal command on Redis; the gateway picks it up and forwards to the right charger socket.

### 7.5 Simulator for development

- Use an open-source OCPP 1.6 simulator (e.g., `MicroOcpp`, `SteVe`, `node-ocpp`).
- Configure simulator to connect to `ws://localhost:9000/ocpp/CHARGER01`.
- The gateway treats the simulator identically to real hardware — full end-to-end booking → start → meter values → stop flow without physical chargers.

### 7.6 Production notes

- Always TLS for OCPP (`wss://`).
- Per-charger auth token; mutual TLS recommended for fleets.
- Run the gateway behind Nginx with WebSocket upgrade enabled.
- Capacity: a single Node OCPP server can handle several thousand idle WS connections; scale horizontally with a connection-affinity hash.

---

## 8. Scalability Considerations

### 8.1 Horizontal scaling

- API and Socket.io servers stateless → run N replicas behind a load balancer.
- Multiple OCPP gateway instances; route by `ocppId` hash with sticky upgrades, or use a connection-registry-in-Redis pattern.
- Redis pub/sub bridges everything (API ↔ Socket.io ↔ OCPP gateway).

### 8.2 Database

- **Replica set** for HA from day one.
- 2dsphere index on `Station.location` for sub-millisecond geo lookups.
- When `ChargingSession.meterReadings` grows hot, switch to a **time-series collection** keyed by `chargerId`.
- Sharding plan (when needed): shard `ChargingSession` by `chargerId` or `startTime`.
- Use `secondaryPreferred` for analytics reads.

### 8.3 Caching (Redis)

- Cache nearby-station results by geohash bucket (TTL ~30s).
- Cache live charger status (avoid hot DB reads on busy stations).
- Rate-limit counters (sliding window).
- JWT denylist for forced logout.

### 8.4 Background jobs (BullMQ)

- Booking expiry sweeps
- Notification dispatch (email/SMS/push)
- Heartbeat monitor → mark chargers `OFFLINE` if last heartbeat > 5 min
- Daily aggregation (kWh delivered, revenue, uptime)

### 8.5 Observability

- Centralized logging via Winston → ELK / Loki
- Metrics with Prometheus + Grafana (latency, active sessions, charger uptime)
- Distributed tracing via OpenTelemetry
- Health endpoints `/healthz`, `/readyz`

### 8.6 Frontend scaling

- Route-based code splitting
- Map marker clustering (`react-leaflet-cluster`) for thousands of stations
- Virtualized lists for booking history
- PWA shell with service worker for offline cache of last-known map data
- CDN for static assets

### 8.7 Capacity tiers (rule-of-thumb)

| Tier | Setup | Capacity |
|---|---|---|
| MVP | 1 API + 1 OCPP + Mongo single + Redis single | ~5–10k MAU, hundreds of chargers |
| Growth | 2–4 API + 2 OCPP + Mongo replica set + Redis primary/replica | ~50–100k MAU, low-thousands of chargers |
| Scale | Auto-scaling groups + Mongo Atlas sharded + Redis Cluster + CDN | 500k+ MAU, 10k+ chargers |

---

## 9. Security Design

### 9.1 Authentication

- **JWT access token** — short-lived (15 min)
- **Refresh token** — long-lived (7–30 days), stored as httpOnly secure cookie or in secure mobile storage
- Passwords hashed with **bcrypt**, cost ≥ 12
- **Refresh token rotation** — old refresh token is invalidated on use; revoked tokens kept in Redis denylist
- Email verification flow (signed token, single-use)
- Forgot password flow (signed token, single-use, short TTL)

### 9.2 Authorization

- Roles: `user`, `operator`, `admin`
- Middleware: `requireRole(['admin','operator'])`
- Resource ownership checks (a user only sees their own bookings/sessions)

### 9.3 API protection

- HTTPS only; TLS terminated at Nginx
- CORS allowlist
- **Helmet** for security headers
- **Rate limiting** per IP and per user (Redis-backed)
- **Input validation** on every endpoint with Joi/Zod
- **NoSQL injection** prevention via typed Mongoose queries + sanitization
- CSRF protection if cookies are used
- Request size limits

### 9.4 Socket.io security

- JWT verified on handshake
- Server authorizes every `subscribe:*` event (you can only join `session:<id>` if you own it)
- Rate-limit per socket

### 9.5 OCPP security

- TLS (`wss://`)
- Per-charger token (HTTP Basic Auth in WS upgrade headers, OCPP security profile 1)
- Mutual TLS recommended for production fleets (security profile 3)

### 9.6 Data protection

- Encrypt sensitive fields at rest (PII, payment refs)
- Never log secrets / tokens
- Audit log for admin actions (station create, refunds, role changes)
- Encrypted backups, retention policy

### 9.7 Dependency hygiene

- `npm audit` in CI
- Snyk / Dependabot alerts
- Pin major versions; renovate weekly

---

## 10. macOS Setup Plan

### 10.1 Required tools

1. **Homebrew** — package manager
2. **nvm** + **Node.js LTS (v20+)** — `brew install nvm && nvm install --lts`
3. **MongoDB Community 7.0** — `brew tap mongodb/brew && brew install mongodb-community`
4. **Redis** — `brew install redis`
5. **Git** — `brew install git`
6. **Postman** or **Insomnia** — API testing
7. **MongoDB Compass** — GUI for Mongo
8. **VS Code** + extensions: ESLint, Prettier, Tailwind IntelliSense, MongoDB for VS Code, REST Client
9. **Docker Desktop** — recommended (run Mongo, Redis, OCPP simulator in containers)
10. **OCPP simulator** (later) — `MicroOcpp`, `SteVe`, or `node-ocpp` simulator

### 10.2 Service startup (local dev)

```
# Terminal A — services
brew services start mongodb-community
brew services start redis

# Terminal B — backend
cd chargeflow-api
cp .env.example .env        # fill in MONGO_URI, JWT_SECRET, etc.
npm install
npm run dev                 # nodemon on :4000

# Terminal C — frontend
cd chargeflow-web
cp .env.example .env        # VITE_API_URL, VITE_SOCKET_URL
npm install
npm run dev                 # vite on :5173

# Terminal D — OCPP simulator (later)
docker run -p 9000:9000 chargeflow-ocpp-sim
```

### 10.3 Environment variables

**Backend (`chargeflow-api/.env`)**
```
PORT=4000
MONGO_URI=mongodb://localhost:27017/chargeflow
REDIS_URL=redis://localhost:6379
JWT_SECRET=...
JWT_REFRESH_SECRET=...
JWT_ACCESS_TTL=15m
JWT_REFRESH_TTL=30d
CORS_ORIGIN=http://localhost:5173
OCPP_PORT=9000
NODE_ENV=development
```

**Frontend (`chargeflow-web/.env`)**
```
VITE_API_URL=http://localhost:4000/api
VITE_SOCKET_URL=http://localhost:4000
VITE_MAP_TILE_URL=https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png
```

### 10.4 Recommended workflow

1. Run Mongo + Redis as background services (brew or Docker).
2. Run backend with `nodemon` for HMR-like reload.
3. Run frontend with Vite (HMR).
4. Use a Postman collection at `docs/postman/ChargeFlow.postman_collection.json` for API smoke tests.
5. Provide a `npm run seed` script that inserts demo stations/chargers.
6. Once OCPP gateway exists, point a simulator at `ws://localhost:9000/ocpp/CHARGER01` for end-to-end booking → session flows.

### 10.5 Optional: docker-compose

A single `docker-compose.yml` at repo root with services `mongo`, `redis`, `api`, `web`, `ocpp-sim` so a new contributor can run the entire stack with `docker compose up`.

---

## Appendix — Build order recommendation

When you start coding, build in this order to keep feedback fast:

1. Auth (register/login/me) → JWT plumbing
2. Station + Charger CRUD + seed script
3. Map page calling `/stations/nearby`
4. Booking flow (create + cancel)
5. Socket.io scaffold + `charger:status` broadcast
6. Live session view (mock telemetry first)
7. OCPP gateway with simulator
8. Admin dashboard
9. Background jobs + notifications
10. Hardening: rate limits, validation, audit logs, observability
