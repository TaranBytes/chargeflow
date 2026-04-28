import { useEffect, useState } from 'react'

// Default fallback if geolocation is denied/unavailable: New Delhi.
const FALLBACK = { lat: 28.6139, lng: 77.209 }

export function useGeolocation() {
  const [position, setPosition] = useState(FALLBACK)
  const [status, setStatus] = useState('idle')

  useEffect(() => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setStatus('unsupported')
      return
    }
    setStatus('locating')
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setPosition({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        setStatus('ready')
      },
      () => setStatus('denied'),
      { enableHighAccuracy: false, timeout: 5000, maximumAge: 60_000 },
    )
  }, [])

  return { position, status }
}
