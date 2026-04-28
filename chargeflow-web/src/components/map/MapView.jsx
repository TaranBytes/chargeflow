import { useEffect, useMemo } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import { Link } from 'react-router-dom'

function getStationStatus(station) {
  const total = station.chargers.length
  const avail = station.chargers.filter((c) => c.status === 'AVAILABLE').length
  if (avail === 0) return 'occupied'
  if (avail < total) return 'partial'
  return 'available'
}

function makeMarkerIcon(status) {
  return L.divIcon({
    className: '',
    html: `<div class="cf-marker ${status}"><span style="font-size:14px;line-height:1;">⚡</span></div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -14],
  })
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

      {stations.map((s) => {
        const status = getStationStatus(s)
        return (
          <Marker
            key={s.id}
            position={[s.location.lat, s.location.lng]}
            icon={makeMarkerIcon(status)}
            eventHandlers={{ click: () => onSelect?.(s) }}
          >
            <Popup>
              <div className="space-y-1 min-w-[180px]">
                <p className="font-semibold text-slate-900 text-sm">{s.name}</p>
                <p className="text-xs text-slate-500">
                  {s.address.city}, {s.address.state}
                </p>
                <p className="text-xs text-slate-700">
                  {s.chargers.filter((c) => c.status === 'AVAILABLE').length}/{s.chargers.length}{' '}
                  available · up to {Math.max(...s.chargers.map((c) => c.powerKW))}kW
                </p>
                <Link
                  to={`/station/${s.id}`}
                  className="text-xs font-semibold text-emerald-600 hover:underline inline-block mt-1"
                >
                  View station →
                </Link>
              </div>
            </Popup>
          </Marker>
        )
      })}
    </MapContainer>
  )
}
