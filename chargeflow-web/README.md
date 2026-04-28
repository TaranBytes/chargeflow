# ChargeFlow Web

Frontend for **ChargeFlow** — EV Charging Station Management System.

A production-grade React dashboard that lets EV drivers discover nearby charging stations, view real-time availability, book slots, and monitor active charging sessions.

## Tech stack

- React 18 + Vite 5
- Tailwind CSS 3
- React Router 6
- Axios (mocked for now, ready to swap to real API)
- React-Leaflet 4 + OpenStreetMap
- socket.io-client (placeholder, ready for real-time wiring)
- lucide-react for icons

## Quick start (macOS)

```bash
# 1. Install Node 20 LTS (recommended via nvm)
brew install nvm
mkdir -p ~/.nvm
export NVM_DIR="$HOME/.nvm"
[ -s "/opt/homebrew/opt/nvm/nvm.sh" ] && . "/opt/homebrew/opt/nvm/nvm.sh"
nvm install --lts
nvm use --lts

# 2. From this folder
npm install

# 3. Configure env
cp .env.example .env

# 4. Start dev server
npm run dev
```

Open <http://localhost:5173>. Demo login: any email + password works.

## Folder structure

```
src/
  api/           # axios client + per-resource API wrappers (mocked)
  assets/
  components/    # reusable UI building blocks
  context/       # AuthContext, SocketContext
  hooks/         # useAuth, useStations, useGeolocation, useSocket
  layouts/       # AppLayout (sidebar + navbar shell)
  pages/         # MapPage, StationDetailPage, BookingPage, ...
  routes/        # AppRoutes, ProtectedRoute
  services/      # socket + storage services
  styles/        # global Tailwind layer + custom CSS
  utils/         # mockData, formatters, constants
```

## Mock data

All data is mocked in `src/utils/mockData.js`. The API wrappers in `src/api/*.api.js` toggle between mock and real via the `USE_MOCK` flag — flip it once the backend is online.

## Real-time (placeholder)

`SocketContext` and `services/socket.service.js` are scaffolded. When the backend is ready, set `VITE_SOCKET_URL` and call `socket.connect()` in the provider.
