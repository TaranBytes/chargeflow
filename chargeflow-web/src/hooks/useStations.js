import { useEffect, useState, useCallback } from 'react'
import { stationApi } from '../api/station.api.js'
import { useSocket } from './useSocket.js'

function applyChargerStatus(stationOrList, evt) {
  const sid = String(evt.stationId ?? '')
  const cid = String(evt.chargerId ?? '')
  const ocppId = evt.ocppId

  const matchCharger = (c) =>
    String(c.id) === cid || String(c._id) === cid || (ocppId && c.ocppId === ocppId)

  const updateOne = (s) => {
    if (sid && String(s.id) !== sid && String(s._id) !== sid) return s
    const chargers = s.chargers?.map((c) =>
      matchCharger(c) ? { ...c, status: evt.status } : c,
    )
    if (!chargers || chargers === s.chargers) return s
    return { ...s, chargers }
  }

  if (Array.isArray(stationOrList)) return stationOrList.map(updateOne)
  if (stationOrList) return updateOne(stationOrList)
  return stationOrList
}

export function useStations() {
  const [stations, setStations] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [reloadTick, setReloadTick] = useState(0)
  const { subscribe } = useSocket() || {}

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

  // Real-time charger status sync
  useEffect(() => {
    if (!subscribe) return
    const off = subscribe('chargerStatusUpdate', (evt) => {
      setStations((prev) => applyChargerStatus(prev, evt))
    })
    return off
  }, [subscribe])

  return { stations, loading, error, reload }
}

export function useStation(id) {
  const [station, setStation] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [reloadTick, setReloadTick] = useState(0)
  const { subscribe } = useSocket() || {}

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

  // Real-time charger status sync for this single station
  useEffect(() => {
    if (!subscribe || !id) return
    const off = subscribe('chargerStatusUpdate', (evt) => {
      const sid = String(evt.stationId ?? '')
      if (sid && String(id) !== sid) return
      setStation((prev) => applyChargerStatus(prev, evt))
    })
    return off
  }, [subscribe, id])

  return { station, loading, error, reload }
}
