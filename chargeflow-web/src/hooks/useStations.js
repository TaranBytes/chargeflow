import { useEffect, useState, useCallback } from 'react'
import { stationApi } from '../api/station.api.js'

export function useStations() {
  const [stations, setStations] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [reloadTick, setReloadTick] = useState(0)

  const reload = useCallback(() => setReloadTick((n) => n + 1), [])

  useEffect(() => {
    let mounted = true
    setLoading(true)
    setError(null)
    stationApi
      .list()
      .then((data) => {
        if (mounted) setStations(data)
      })
      .catch((e) => {
        if (mounted) setError(e)
      })
      .finally(() => {
        if (mounted) setLoading(false)
      })
    return () => {
      mounted = false
    }
  }, [reloadTick])

  return { stations, loading, error, reload }
}

export function useStation(id) {
  const [station, setStation] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [reloadTick, setReloadTick] = useState(0)

  const reload = useCallback(() => setReloadTick((n) => n + 1), [])

  useEffect(() => {
    let mounted = true
    if (!id) {
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    stationApi
      .getById(id)
      .then((data) => {
        if (mounted) setStation(data)
      })
      .catch((e) => {
        if (mounted) setError(e)
      })
      .finally(() => {
        if (mounted) setLoading(false)
      })
    return () => {
      mounted = false
    }
  }, [id, reloadTick])

  return { station, loading, error, reload }
}
