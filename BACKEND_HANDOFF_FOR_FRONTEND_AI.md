# ChargeFlow Backend Handoff (For Frontend AI)

This document is the backend contract for building/redesigning the frontend safely.

Use this as the source of truth for API payloads, auth behavior, and real-time events.

## 1) Stack + Runtime

- Backend root: `chargeflow-api`
- Runtime: Node.js + Express + MongoDB (Mongoose) + Socket.io
- Base URL (local): `http://localhost:5000`
- API prefix: `/api`
- Health: `GET /healthz`
- Socket endpoint: same host/port (`ws://localhost:5000`)

## 2) Environment

Required env keys (see `chargeflow-api/.env.example`):

- `MONGO_URI`
- `JWT_SECRET`
- `JWT_EXPIRES_IN` (default `7d`)
- `CLIENT_URL` (used for CORS allowlist; comma-separated supported)

## 3) Response Envelope + Errors

Success shape:

```json
{
  "success": true,
  "data": {}
}
```

Error shape:

```json
{
  "success": false,
  "error": {
    "code": "SOME_CODE",
    "message": "Human readable message",
    "details": {}
  }
}
```

Common error codes:

- `UNAUTHENTICATED`, `INVALID_TOKEN`, `TOKEN_EXPIRED`
- `VALIDATION`, `INVALID_ID`, `DUPLICATE`
- `BOOKING_CONFLICT`
- `RATE_LIMITED`

## 4) Auth Model (JWT)

- Client stores token and sends: `Authorization: Bearer <token>`
- JWT contains: `userId`, `role`
- Protected routes require valid bearer token
- Auth endpoints are rate-limited (`/api/auth`, 50 req / 15 min / IP)

### Auth endpoints

#### POST `/api/auth/signup`

Request:

```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "secret123",
  "phone": "+91..."
}
```

Response:

```json
{
  "success": true,
  "data": {
    "user": { "id": "...", "name": "...", "email": "...", "role": "user" },
    "token": "jwt..."
  }
}
```

#### POST `/api/auth/login`

Request:

```json
{
  "email": "john@example.com",
  "password": "secret123"
}
```

Response: same shape as signup.

#### GET `/api/auth/me` (protected)

Response:

```json
{
  "success": true,
  "data": {
    "user": { "id": "...", "name": "...", "email": "...", "role": "user" }
  }
}
```

#### POST `/api/auth/forgot-password`

Request:

```json
{
  "email": "john@example.com"
}
```

Response:

```json
{
  "success": true,
  "data": {
    "ok": true,
    "resetToken": "dev_only_token_in_non_prod"
  },
  "message": "If that email is registered, a reset link has been sent."
}
```

Notes:
- Email existence is intentionally not revealed.
- In non-production, `resetToken` is returned for demo/testing.

#### POST `/api/auth/reset-password`

Request:

```json
{
  "token": "reset_token",
  "newPassword": "newStrongPass123"
}
```

Response:

```json
{
  "success": true,
  "data": { "ok": true },
  "message": "Password reset successful. Please sign in."
}
```

## 5) Domain Models (Frontend-Relevant)

### User
- `id`, `name`, `email`, `role`, `phone`, `avatar`, `vehicles[]`

### Station
- `id`, `name`, `description`, `status`, `address`, `location`
- `location` returned as `{ lat, lng }` in station list

### Charger
- `id`, `ocppId`, `station`, `type` (`AC|DC`), `connectorType`, `powerKW`, `pricePerKWh`
- `status` (`AVAILABLE|RESERVED|OCCUPIED|OFFLINE|FAULTED`)

### Booking
- `id`, `user`, `charger`, `station`, `startTime`, `endTime`
- `estimatedKWh`, `estimatedCost`
- `status` (`PENDING|CONFIRMED|IN_PROGRESS|COMPLETED|CANCELLED|EXPIRED`)
- `paymentStatus` (`UNPAID|PAID|REFUNDED`)

### ChargingSession
- `id`, `booking`, `user`, `charger`, `station`
- `startTime`, `endTime`
- `energyConsumed`, `cost`
- `status` (`ACTIVE|COMPLETED|INTERRUPTED|FAULTED`)

## 6) HTTP API Surface

### Stations

- `GET /api/stations?search=&city=&page=1&limit=50`
  - public
  - returns station list + each station includes `chargers[]`
- `GET /api/stations/:id`
  - public
  - returns station + chargers
- `GET /api/stations/:id/chargers`
  - public

### Bookings (protected)

- `POST /api/bookings`
  - body:
    ```json
    {
      "chargerId": "mongo_id",
      "startTime": "ISO",
      "endTime": "ISO",
      "estimatedKWh": 25.5,
      "estimatedCost": 450
    }
    ```
  - returns created booking
  - can return `409 BOOKING_CONFLICT`
- `GET /api/bookings/my`
  - returns current user's bookings
- `DELETE /api/bookings/:id`
  - cancel booking
- `PATCH /api/bookings/:id/cancel`
  - backward-compatible cancel alias

### Sessions (protected)

- `POST /api/sessions/start`
  - body:
    ```json
    {
      "chargerId": "mongo_id",
      "bookingId": "mongo_id_optional"
    }
    ```
- `POST /api/sessions/:id/stop`
  - body:
    ```json
    { "energyConsumed": 18.2 }
    ```
  - `energyConsumed` optional; backend still computes final state
- `GET /api/sessions/active`
  - returns current active session or `404` if none

## 7) Real-Time Socket Contract

Connect:

```js
io("http://localhost:5000", { auth: { token } });
```

Server validates JWT on handshake.

### Client -> Server room subscriptions

- `subscribe:station` `{ stationId }`
- `unsubscribe:station` `{ stationId }`
- `subscribe:charger` `{ chargerId }`
- `subscribe:session` `{ sessionId }`

### Server -> Client events

- `chargerStatusUpdate`
  - payload: `{ chargerId, stationId, status, ocppId }`
- `bookingCreated`
  - payload: `{ booking }`
- `bookingUpdate`
  - payload: `{ booking }`
- `chargingStarted`
  - payload: `{ session }`
- `chargingStopped`
  - payload: `{ session }`
- `sessionTick`
  - payload: `{ sessionId, ...telemetry }`

## 8) Critical Business Rules For UI

- Booking conflict condition:
  - overlap if `existing.startTime < newEnd` and `existing.endTime > newStart`
  - backend rejects with `409 BOOKING_CONFLICT`
- Charger/session state transitions matter:
  - booking can move charger to `RESERVED`
  - session start sets charger `OCCUPIED`
  - session stop releases charger to `AVAILABLE`
- Frontend should treat `404 /sessions/active` as normal "no active session"

## 9) Frontend Integration Notes

- Always normalize IDs:
  - backend may return nested references; map `id || _id` defensively
- Keep a local normalized model for:
  - `stationName`, `chargerName`, `chargerCode`, etc.
- Prefer optimistic UI only where reversible; otherwise trust socket updates.
- Handle auth expiry globally:
  - on `401`, clear local session and route to `/login`.

## 10) Suggested Prompt For Frontend-Focused AI

Use this prompt with the redesign AI:

```text
Redesign the ChargeFlow frontend with a premium dark theme and modern UX while preserving all existing backend contracts.
Use BACKEND_HANDOFF_FOR_FRONTEND_AI.md as strict API/socket source of truth.
Do not invent endpoints.
Implement robust loading/error/empty/auth-expired states.
Keep route structure compatible with existing app.
Return production-quality React + Tailwind UI with reusable components and accessibility-compliant contrast/focus behavior.
```

