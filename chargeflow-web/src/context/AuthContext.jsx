import { createContext, useState, useCallback } from 'react'

export const AuthContext = createContext(null)

const MOCK_USER = {
  id: 'u_demo_1',
  name: 'Sahib Singh',
  email: 'sahib@chargeflow.dev',
  avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=Sahib%20Singh&backgroundType=gradientLinear&backgroundColor=10b981,34d399',
  role: 'user',
  token: 'mock.jwt.token.placeholder',
  vehicles: [
    { id: 'v1', make: 'Tata', model: 'Nexon EV', batteryKWh: 40, connectorType: 'CCS' },
    { id: 'v2', make: 'MG', model: 'ZS EV', batteryKWh: 50, connectorType: 'CCS' },
  ],
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const raw = localStorage.getItem('cf_user')
      return raw ? JSON.parse(raw) : null
    } catch {
      return null
    }
  })
  const [loading, setLoading] = useState(false)

  const login = useCallback(async (email /*, password */) => {
    setLoading(true)
    // Simulate latency for now. Replace with real API call later:
    // const { data } = await api.post('/auth/login', { email, password })
    await new Promise((r) => setTimeout(r, 500))
    const u = { ...MOCK_USER, email: email || MOCK_USER.email }
    localStorage.setItem('cf_user', JSON.stringify(u))
    setUser(u)
    setLoading(false)
    return u
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('cf_user')
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}
