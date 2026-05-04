import { createContext, useState, useCallback, useEffect } from 'react'
import { request, setUnauthorizedHandler } from '../api/client.js'
import { storage } from '../services/storage.service.js'

export const AuthContext = createContext(null)

function normalizeSession(payload) {
  if (!payload) return null
  const token = payload.token || payload.accessToken || payload.user?.token
  const profile = payload.user && typeof payload.user === 'object' ? payload.user : payload
  if (!token) return null
  return {
    ...profile,
    token,
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    return normalizeSession(storage.get('cf_user'))
  })
  const [loading, setLoading] = useState(false)

  const updateUser = useCallback((updater) => {
    setUser((prev) => {
      if (!prev) return prev
      const nextProfile =
        typeof updater === 'function' ? updater(prev) : { ...prev, ...(updater || {}) }
      const next = nextProfile ? { ...nextProfile, token: prev.token } : prev
      storage.set('cf_user', next)
      return next
    })
  }, [])

  const logout = useCallback(() => {
    storage.remove('cf_user')
    setUser(null)
  }, [])

  const login = useCallback(async (email, password) => {
    setLoading(true)
    try {
      const data = await request('post', '/auth/login', { data: { email, password } })
      const session = normalizeSession(data)
      storage.set('cf_user', session)
      setUser(session)
      return session
    } finally {
      setLoading(false)
    }
  }, [])

  const signup = useCallback(async ({ name, email, password, phone }) => {
    setLoading(true)
    try {
      const data = await request('post', '/auth/signup', {
        data: { name, email, password, phone: phone || undefined },
      })
      const session = normalizeSession(data)
      storage.set('cf_user', session)
      setUser(session)
      return session
    } finally {
      setLoading(false)
    }
  }, [])

  const adminLogin = useCallback(async (email, password) => {
    setLoading(true)
    try {
      const data = await request('post', '/admin/login', { data: { email, password } })
      const session = normalizeSession(data)
      storage.set('cf_user', session)
      setUser(session)
      return session
    } finally {
      setLoading(false)
    }
  }, [])

  const addVehicle = useCallback(async (vehicle) => {
    const data = await request('post', '/auth/me/vehicles', { data: vehicle })
    const next = normalizeSession({
      ...user,
      user: data?.user || user,
    })
    if (next) {
      storage.set('cf_user', next)
      setUser(next)
    }
    return data?.vehicle
  }, [user])

  const removeVehicle = useCallback(async (index) => {
    const data = await request('delete', `/auth/me/vehicles/${index}`)
    const next = normalizeSession({
      ...user,
      user: data?.user || user,
    })
    if (next) {
      storage.set('cf_user', next)
      setUser(next)
    }
  }, [user])

  useEffect(() => {
    let cancelled = false
    const hydrate = async () => {
      const session = normalizeSession(storage.get('cf_user'))
      if (!session?.token) return
      try {
        const me = await request('get', '/auth/me')
        const next = normalizeSession({ ...session, user: me?.user || me })
        if (!cancelled && next) {
          storage.set('cf_user', next)
          setUser(next)
        }
      } catch {
        if (!cancelled) logout()
      }
    }
    hydrate()
    return () => {
      cancelled = true
    }
  }, [logout])

  useEffect(() => {
    setUnauthorizedHandler(() => logout())
    return () => setUnauthorizedHandler(null)
  }, [logout])

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        adminLogin,
        signup,
        logout,
        updateUser,
        addVehicle,
        removeVehicle,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
