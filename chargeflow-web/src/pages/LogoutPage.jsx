import { useEffect } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth.js'

export default function LogoutPage() {
  const { user, logout } = useAuth()

  useEffect(() => {
    logout()
  }, [logout])

  if (user) return null
  return <Navigate to="/login" replace />
}

