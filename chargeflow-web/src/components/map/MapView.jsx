import { memo, useEffect, useMemo } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import { Link } from 'react-router-dom'

function getStationStatus(station) {
  const total = station.chargers.length
  if (!total) return 'occupied'
  const avail = station.chargers.filter((c) => c.status === 'AVAILABLE').length
  const reserved = station.chargers.filter((c) => c.status === 'RESERVED').length
  if (avail === 0 && reserved > 0) return 'partial' // yellow per spec (reserved)
  if (avail === 0) return 'occupied' // red
  if (avail < total) return 'partial' // amber
  return 'available' // green
}

// Cache divIcon instances by status — recreating per marker is wasteful.
const ICON_CACHE = new Map()
function getMarkerIcon(status) {
  if (ICON_CACHE.has(status)) return ICON_CACHE.get(status)
  const icon = L.divIcon({
    className: '',
    html: `<div class="cf-marker ${status}"><span style="font-size:14px;line-height:1;">⚡</span></div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -14],
  })
  ICON_CACHE.set(status, icon)
  return icon
}

function PanTo({ center }) {
  const map = useMap()
  useEffect(() => {
    if (center) {
      map.flyTo([center.lat, center.lng], Math.max(map.getZoom(), 12), { duration: 0.6 })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [center?.lat, center?.lng])
  return null
}

const StationMarker = memo(
  function StationMarker({ station, onSelect }) {
    const status = getStationStatus(station)
    const avail = station.chargers.filter((c) => c.status === 'AVAILABLE').length
    return (
      <Marker
        position={[station.location.lat, station.location.lng]}
        icon={getMarkerIcon(status)}
        eventHandlers={{ click: () => onSelect?.(station) }}
      >
        <Popup>
          <div className="space-y-1 min-w-[180px]">
            <p className="font-semibold text-slate-900 text-sm">{station.name}</p>
            <p className="text-xs text-slate-500">
              {station.address.city}, {station.address.state}
            </p>
            <p className="text-xs text-slate-700">
              {avail}/{station.chargers.length} available · up to{' '}
              {Math.max(...station.chargers.map((c) => c.powerKW))}kW
            </p>
            <Link
              to={`/station/${station.id}`}
              className="text-xs font-semibold text-emerald-600 hover:underline inline-block mt-1"
            >
              View station →
            </Link>
          </div>
        </Popup>
      </Marker>
    )
  },
  (prev, next) => {
    if (prev.onSelect !== next.onSelect) return false
    const a = prev.station
    const b = next.station
    if (a === b) return true
    if (a.id !== b.id) return false
    if (a.location.lat !== b.location.lat || a.location.lng !== b.location.lng) return false
    if (a.chargers.length !== b.chargers.length) return false
    const aFp = a.chargers.map((c) => c.status).join('|')
    const bFp = b.chargers.map((c) => c.status).join('|')
    return aFp === bFp
  },
)

export default function MapView({ stations, center, onSelect, selected }) {
  const tileUrl = useMemo(
    () => import.meta.env.VITE_MAP_TILE_URL || 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    [],
  )

  return (
    <MapContainer
      center={[center.lat, center.lng]}
      zoom={11}
      scrollWheelZoom
      className="h-full w-full"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url={tileUrl}
      />
      <PanTo center={selected ? selected.location : center} />

      {stations.map((s) => (
        <StationMarker key={s.id} station={s} onSelect={onSelect} />
      ))}
    </MapContainer>
  )
}
