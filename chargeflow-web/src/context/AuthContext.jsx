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
    <AuthContext.Provider value={{ user, loading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  )
}
