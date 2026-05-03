import { memo, useEffect, useMemo } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap, ZoomControl } from 'react-leaflet'
import L from 'leaflet'
import { Link } from 'react-router-dom'

function getStationStatus(station) {
  const total = station.chargers.length
  if (!total) return 'occupied'
  const avail = station.chargers.filter((c) => c.status === 'AVAILABLE').length
  const reserved = station.chargers.filter((c) => c.status === 'RESERVED').length
  if (avail === 0 && reserved > 0) return 'partial'
  if (avail === 0) return 'occupied'
  if (avail < total) return 'partial'
  return 'available'
}

const ICON_CACHE = new Map()
function getMarkerIcon(status, isSelected) {
  const key = `${status}-${isSelected ? '1' : '0'}`
  if (ICON_CACHE.has(key)) return ICON_CACHE.get(key)
  const sel = isSelected ? ' cf-marker--selected' : ''
  const icon = L.divIcon({
    className: '',
    html: `<div class="cf-marker ${status}${sel}"><span style="font-size:14px;line-height:1;">⚡</span></div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -14],
  })
  ICON_CACHE.set(key, icon)
  return icon
}

function MapPanController({ center, selected, hoveredStation }) {
  const map = useMap()
  useEffect(() => {
    if (!center?.lat) return
    const h = hoveredStation
    const s = selected
    if (h) {
      map.flyTo([h.lat, h.lng], Math.max(map.getZoom(), 12), { duration: 0.35 })
    } else if (s) {
      map.flyTo([s.lat, s.lng], Math.max(map.getZoom(), 13), { duration: 0.5 })
    } else {
      map.flyTo([center.lat, center.lng], 11, { duration: 0.45 })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    center?.lat,
    center?.lng,
    selected?.location?.lat,
    selected?.location?.lng,
    hoveredStation?.lat,
    hoveredStation?.lng,
  ])
  return null
}

const StationMarker = memo(
  function StationMarker({ station, onSelect, isSelected }) {
    const status = getStationStatus(station)
    const avail = station.chargers.filter((c) => c.status === 'AVAILABLE').length
    return (
      <Marker
        position={[station.location.lat, station.location.lng]}
        icon={getMarkerIcon(status, isSelected)}
        zIndexOffset={isSelected ? 1000 : 0}
        eventHandlers={{ click: () => onSelect?.(station) }}
      >
        <Popup>
          <div className="min-w-[180px] space-y-1">
            <p className="text-sm font-semibold text-white">{station.name}</p>
            <p className="text-xs text-[rgba(255,255,255,0.65)]">
              {station.address.city}, {station.address.state}
            </p>
            <p className="text-xs text-[rgba(255,255,255,0.88)]">
              {avail}/{station.chargers.length} available · up to{' '}
              {Math.max(...station.chargers.map((c) => c.powerKW))}kW
            </p>
            <Link
              to={`/station/${station.id}`}
              className="mt-1 inline-block text-xs font-semibold text-[#FFDE42] transition hover:text-[#ffd000] hover:underline"
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
    if (prev.isSelected !== next.isSelected) return false
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

export default function MapView({ stations, center, onSelect, selected, hoveredStation }) {
  const tileUrl = useMemo(
    () => import.meta.env.VITE_MAP_TILE_URL || 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    [],
  )

  const hoveredLoc = hoveredStation
    ? { lat: hoveredStation.location.lat, lng: hoveredStation.location.lng }
    : null
  const selectedLoc = selected
    ? { lat: selected.location.lat, lng: selected.location.lng }
    : null

  return (
    <MapContainer
      center={[center.lat, center.lng]}
      zoom={11}
      scrollWheelZoom
      zoomControl={false}
      className="z-0 h-full w-full min-h-0 rounded-3xl"
    >
      <ZoomControl position="topright" />
      <MapPanController
        center={center}
        selected={selectedLoc}
        hoveredStation={hoveredLoc}
      />
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url={tileUrl}
      />

      {stations.map((s) => (
        <StationMarker
          key={s.id}
          station={s}
          onSelect={onSelect}
          isSelected={selected?.id === s.id}
        />
      ))}
    </MapContainer>
  )
}
