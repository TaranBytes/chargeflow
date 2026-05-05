# ChargeFlow Project Technical Report

Generated on: 2026-05-05  
Scope: complete repository audit of `chargeflow-api` and `chargeflow-web` plus architecture/handoff docs in repo root.

## 1) Project Overview

ChargeFlow is an EV charging management platform with:
- A React + Vite frontend (`chargeflow-web`) for users/admins.
- A Node.js + Express + MongoDB backend (`chargeflow-api`) exposing REST + Socket.io.
- Supporting docs for future scaling/OCPP architecture (`ChargeFlow-Architecture.md`, `BACKEND_HANDOFF_FOR_FRONTEND_AI.md`).

Current implementation is production-minded for core app flows (auth, stations, bookings, sessions, admin operations), but some root-level architecture docs describe future/extended components that are not yet present in code (Redis adapter, separate OCPP gateway service, BullMQ jobs, etc.).

## 2) Repository Structure

Root:
- `chargeflow-api/` - backend service
- `chargeflow-web/` - frontend SPA
- `archive/ev-charging-stations-india.csv` - data source used by importer script
- `ChargeFlow-Architecture.md` - target/reference architecture
- `BACKEND_HANDOFF_FOR_FRONTEND_AI.md` - backend contract guide for frontend work

Backend (`chargeflow-api/src`) main modules:
- `config/` (`env.js`, `db.js`, `socket.js`)
- `routes/` (auth, station, charger, booking, session, admin)
- `controllers/` (HTTP handlers)
- `services/` (business logic)
- `models/` (Mongoose schemas)
- `middleware/` (auth, validation, error, request logging)
- `sockets/` (Socket.io server and room/event handlers)
- `utils/` (`ApiError`, `asyncHandler`, `jwt`, logger)

Frontend (`chargeflow-web/src`) main modules:
- `api/` (axios client + API wrappers)
- `context/` (Auth, Socket, Toast)
- `routes/` (app routing + route guards)
- `pages/` (user/admin screens)
- `components/` (UI modules by feature)
- `services/` (storage, notifications, socket helper)
- `hooks/` (auth, stations, geolocation, socket, toast)
- `layouts/` (app shell)
- `utils/` (formatters/constants/mock data)

## 3) Tech Stack

Backend:
- Runtime: Node.js (ESM)
- Framework: Express
- DB: MongoDB via Mongoose
- Realtime: Socket.io
- Auth/Security: JWT (`jsonwebtoken`), `bcryptjs`, `helmet`, `cors`, `express-rate-limit`
- Validation: Joi
- Parsing/ops: `dotenv`, `compression`, `morgan`
- Dev: `nodemon`
- Optional dev fallback: `mongodb-memory-server`
- Data import: `csv-parser`

Frontend:
- React 18 + Vite 5
- React Router 6
- Tailwind CSS + PostCSS + Autoprefixer
- Axios
- Socket.io client
- React-Leaflet + Leaflet
- Framer Motion
- Lucide React

## 4) Runtime and Configuration Flow

### 4.1 Backend bootstrap flow

Entrypoint: `chargeflow-api/src/server.js`
1. Load validated environment from `config/env.js`.
2. Connect to MongoDB (`connectDB()` from `config/db.js`).
3. Build Express app (`buildApp()` in `app.js`).
4. Create HTTP server and initialize Socket.io (`initSocket(server)`).
5. Listen on configured `PORT`.
6. Register graceful shutdown handlers (`SIGTERM`, `SIGINT`) and unhandled error logging.

### 4.2 Backend environment variables

From code (`config/env.js`) required keys:
- `MONGO_URI` (required)
- `JWT_SECRET` (required, min length check)

Optional/defaulted:
- `NODE_ENV` (`development` default)
- `PORT` (`5000` default)
- `JWT_EXPIRES_IN` (`7d`)
- `CLIENT_URL` (`http://localhost:5173`) - also parsed into CORS origin allowlist
- `LOG_LEVEL` (`dev`)

Important note:
- `config/db.js` has in-memory Mongo fallback when `MONGO_URI` is missing, but `env.js` currently requires `MONGO_URI`, so fallback is effectively unreachable unless env validation is relaxed.

### 4.3 Frontend runtime config

From `chargeflow-web/.env.example`:
- `VITE_API_URL` (default expected `http://localhost:5000/api`)
- `VITE_SOCKET_URL` (default expected `http://localhost:5000`)
- `VITE_MAP_TILE_URL`

Used by:
- API client: `src/api/client.js`
- Socket provider/service: `src/context/SocketContext.jsx`, `src/services/socket.service.js`
- Map tiles: `src/components/map/MapView.jsx`

## 5) Backend HTTP Architecture

### 5.1 Middleware chain (`chargeflow-api/src/app.js`)

Applied in order:
1. `helmet()`
2. `cors()` with dynamic origin allowlist from env `CLIENT_URL`
3. `express.json({ limit: '1mb' })`
4. `express.urlencoded({ extended: true })`
5. `compression()`
6. request logger middleware
7. rate limiter on `/api/auth` (50 requests / 15 min / IP)
8. mount `/api` routes
9. `notFound` middleware
10. centralized `errorHandler`

Health endpoints:
- `GET /healthz`
- `GET /readyz`

### 5.2 API base routing

`/api` mounts:
- `/auth`
- `/stations`
- `/chargers`
- `/bookings`
- `/sessions`
- `/admin`

## 6) Complete API Inventory (Implemented)

Base URL: `<host>:<port>/api`  
Auth style: `Authorization: Bearer <JWT>`

### 6.1 Auth APIs (`/api/auth`)

- `POST /signup`  
  Validation: `name`, `email`, `password`, optional `phone`  
  Purpose: register user and return token/user payload.

- `POST /login`  
  Validation: `email`, `password`  
  Purpose: authenticate user and return token/user payload.

- `POST /forgot-password`  
  Validation: `email`  
  Purpose: create reset token workflow (token exposed in non-production for demo/testing).

- `POST /reset-password`  
  Validation: `token`, `newPassword`  
  Purpose: complete password reset.

- `GET /me` (protected)  
  Purpose: fetch currently authenticated user.

- `POST /me/vehicles` (protected)  
  Validation: `make`, `model`, `batteryKWh`, `connectorType`  
  Purpose: add vehicle to user profile.

- `DELETE /me/vehicles/:index` (protected)  
  Validation: integer `index` in params  
  Purpose: remove indexed vehicle from profile.

### 6.2 Station APIs (`/api/stations`)

- `GET /`  
  Query validation: `search`, `city`, `page`, `limit`  
  Purpose: list stations with filters/pagination.

- `GET /:id`  
  Purpose: station details with charger data.

- `GET /:id/chargers`  
  Purpose: chargers for station.

### 6.3 Charger APIs (`/api/chargers`)

- `GET /:id`  
  Purpose: charger details.

### 6.4 Booking APIs (`/api/bookings`)

- `POST /` (protected)  
  Validation: `chargerId`, `startTime`, `endTime`, optional estimates  
  Purpose: create booking with overlap conflict detection.

- `GET /my` (protected)  
  Purpose: current user booking list.

- `DELETE /:id` (protected)  
  Purpose: cancel booking, including charger release logic where relevant.

- `PATCH /:id/cancel` (protected)  
  Purpose: backward-compatible cancel alias for frontend compatibility.

### 6.5 Session APIs (`/api/sessions`)

- `POST /start` (protected)  
  Validation: `chargerId`, optional `bookingId`  
  Purpose: start charging session; set charger occupancy.

- `POST /:id/stop` (protected)  
  Validation: optional `energyConsumed`  
  Purpose: stop active session; compute final state/cost; release charger.

- `GET /active` (protected)  
  Purpose: active session for current user.

### 6.6 Admin APIs (`/api/admin`)

Public admin login:
- `POST /login`

All below require `protect + requireRole('admin')`:
- `GET /stations`
- `POST /stations`
- `PUT /stations/:id`
- `DELETE /stations/:id`
- `GET /chargers`
- `PUT /chargers/:id`
- `PATCH /chargers/:id/toggle`
- `GET /sessions`
- `GET /sessions/active`
- `GET /users`
- `PATCH /users/:id/block`
- `GET /revenue/summary`
- `GET /revenue/timeseries`
- `GET /alerts`

## 7) Auth and Authorization Internals

Auth middleware (`middleware/auth.middleware.js`):
- Extracts bearer token from `Authorization` header.
- Verifies JWT.
- Loads user and blocks request if user is blocked.
- Attaches authenticated user to request context.

Authorization:
- Role-based guard via `requireRole('admin')` for admin router block.

Token lifecycle:
- Signing/verifying utility in `utils/jwt.js`.
- Password hashing and comparison via model/service (`bcryptjs`).

## 8) MongoDB Design

Connection:
- Managed via `mongoose.connect()` in `config/db.js`
- Connection events logged (connected, reconnected, disconnected, error)
- `autoIndex` disabled in production mode
- `serverSelectionTimeoutMS` configured

Collections/models:
1. `User`
2. `Station`
3. `Charger`
4. `Booking`
5. `ChargingSession` (`Session.model.js`)
6. `Alert`

### 8.1 Key schema/index highlights

`User`:
- Unique indexed email
- Role flags
- Vehicle list
- Reset-password token fields

`Station`:
- GeoJSON location (`Point`) with `2dsphere` index
- Text index on station name and city
- Status/pricing/address metadata

`Charger`:
- Unique `ocppId`
- Station reference index
- Status index
- Booking/session references

`Booking`:
- References to user/station/charger/session
- Time range + pricing estimates + status/payment status
- Overlap-related index strategy

`ChargingSession`:
- References booking/user/station/charger
- Start/stop timestamps
- energy/cost/status fields
- active lookup indexes

`Alert`:
- Severity/type/message + references
- createdAt/severity indexes for admin retrieval

## 9) Booking and Session Business Rules

Booking:
- Conflict detection based on overlap rule:
  - existing.start < new.end AND existing.end > new.start
- On successful booking, charger state may move to reserved state.

Session lifecycle:
- Start session sets charger to occupied and can transition booking to in-progress.
- Stop session computes final values, sets charger back to available, and can complete linked booking.

## 10) Real-Time Architecture (Implemented)

Socket bootstrap:
- `chargeflow-api/src/sockets/index.js`
- Mounted on same host/port as API server.

Socket authentication:
- JWT accepted from `socket.handshake.auth.token` or authorization header.
- Unauthorized socket connections are rejected.

Room subscriptions (client -> server):
- `subscribe:station`
- `unsubscribe:station`
- `subscribe:charger`
- `subscribe:session`

Emitted events (server -> clients):
- `chargerStatusUpdate`
- `bookingCreated`
- `bookingUpdate`
- `chargingStarted`
- `chargingStopped`
- `sessionTick` (helper exists; currently limited consumer usage in frontend)

Security caveat in code comments:
- `subscribe:session` has a noted TODO/caveat around ownership validation hardening.

## 11) Backend Scripts and Data Operations

From `chargeflow-api/package.json`:
- `npm run dev` - nodemon server
- `npm start` - node server
- `npm run seed` - seed sample data
- `npm run seed:reset` - reset DB and seed
- `npm run api:smoke` - API smoke test workflow
- `npm run import:stations:csv` - import stations from CSV

`scripts/seed.js`:
- Upserts demo users, stations, chargers
- Creates sample booking/session data
- Supports collection reset
- Syncs indexes

`scripts/import-stations-from-csv.mjs`:
- Reads CSV rows
- Validates lat/lng
- Generates deterministic importer IDs
- Creates station + inferred charger records

## 12) Frontend Architecture Deep Dive

### 12.1 Boot and provider layering

`src/main.jsx` wraps app in:
1. `ErrorBoundary`
2. `BrowserRouter`
3. `ToastProvider`
4. `AuthProvider`
5. `SocketProvider`
6. App routes

### 12.2 Routing and access control

Routes in `src/routes/AppRoutes.jsx`:
- Public auth routes (`/login`, `/signup`, `/forgot-password`, `/reset-password`, `/admin/login`, `/logout`)
- Protected user routes behind `ProtectedRoute`
- Admin-specific routes behind `ProtectedRoute allowedRoles={['admin']}`

### 12.3 Frontend state model

Global contexts:
- `AuthContext`:
  - token/user persistence (`cf_user`)
  - login/signup/adminLogin/logout
  - hydrates user using `/auth/me`
  - hooks into global 401 handler from axios client
- `SocketContext`:
  - connects on authenticated token
  - exposes `connected`, `subscribe`, `emit`
  - receives push events and triggers notifications/toasts
- `ToastContext`:
  - UX feedback channel

### 12.4 API client behavior

`src/api/client.js`:
- Base URL from env (`VITE_API_URL`) with fallback
- Request interceptor:
  - attach JWT bearer token
  - inject `X-Request-Id`
  - strip nullish query params
- Response interceptor:
  - normalize errors
  - trigger unauthorized callback on 401
- `request()` helper unwraps standard response envelope

### 12.5 Major frontend feature modules

User-facing:
- Station discovery map (`MapPage`, `MapView`, station hooks/components)
- Station detail + chargers
- Booking flow (`BookingPage`, slot picker)
- Booking history
- Active session view
- Profile and vehicle management
- Notification center

Admin-facing:
- Dashboard
- Stations management
- Chargers management
- Sessions monitoring
- Users block/unblock
- Revenue views
- Alerts list

## 13) Frontend ↔ Backend Contract Alignment

Default alignment (from examples/config):
- Frontend default API URL and socket URL target backend port 5000.
- Frontend dev server default 5173 matches backend CORS default `CLIENT_URL`.

Observed practical note in this workspace:
- Backend `.env` can override to non-default port (for example 5050), requiring matching frontend `.env` values.

Functional gap:
- Backend can emit `sessionTick`; frontend currently has limited/no full telemetry subscription usage compared to other socket events.

## 14) Documentation vs Current Implementation (Important)

Root architecture doc (`ChargeFlow-Architecture.md`) includes future-scale design elements not fully implemented in this codebase yet:
- Redis cache/pubsub + Socket.io Redis adapter
- Separate OCPP gateway service with full OCPP message handlers
- BullMQ/background jobs
- Advanced observability pipeline
- Additional endpoints and models beyond current implemented surface

Treat current source code in `chargeflow-api` and `chargeflow-web` as implementation truth for runtime behavior.

## 15) Security Posture (Current Code)

Implemented controls:
- Helmet headers
- CORS allowlist
- Auth route rate limit
- Joi validation at route boundaries
- JWT auth + role guard
- Centralized error handling with normalized envelope style

Known limitations / cleanup items:
- In-memory DB fallback unreachable with strict env requirement
- Session-room subscription authorization should be explicitly hardened
- Non-prod password reset token exposure is intentional for dev, must not be enabled in production patterns

## 16) Build, Run, and Verification

Backend:
1. `cd chargeflow-api`
2. `cp .env.example .env` and fill required values
3. `npm install`
4. `npm run seed` (optional)
5. `npm run dev`

Frontend:
1. `cd chargeflow-web`
2. `cp .env.example .env` (or set API/socket URL matching backend port)
3. `npm install`
4. `npm run dev`

Quick checks:
- `GET /healthz`
- Login/signup
- List stations
- Create booking
- Start/stop session
- Verify socket updates on booking/session transitions

## 17) Final Summary

ChargeFlow is structured as a clear two-app architecture with strong module separation and an implemented end-to-end domain for EV booking and charging operations:
- Backend provides authenticated REST + realtime updates backed by MongoDB schemas designed for station/charger/session workloads.
- Frontend is already organized around route guards, global auth/socket providers, and feature-oriented pages/components for both users and admins.
- The repository also contains ambitious architecture docs for future scaling (Redis/OCPP/jobs), but those are roadmap-level compared to currently shipped code.

This report captures the current repository implementation and its operational contract in detail, including API surface, database design, middleware/security controls, and realtime event model.
