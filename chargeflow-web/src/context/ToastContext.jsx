import { createContext, useState, useCallback, useRef } from 'react'
import { ToastViewport } from '../components/common/Toast.jsx'

export const ToastContext = createContext(null)

let counter = 0
const nextId = () => `t_${Date.now()}_${counter++}`

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const timers = useRef(new Map())

  const dismiss = useCallback((id) => {
    setToasts((curr) => curr.filter((t) => t.id !== id))
    const tm = timers.current.get(id)
    if (tm) {
      clearTimeout(tm)
      timers.current.delete(id)
    }
  }, [])

  const showToast = useCallback(
    ({ type = 'info', title, message, duration = 4000 }) => {
      const id = nextId()
      setToasts((curr) => [...curr, { id, type, title, message }])
      if (duration > 0) {
        const tm = setTimeout(() => dismiss(id), duration)
        timers.current.set(id, tm)
      }
      return id
    },
    [dismiss],
  )

  // Convenience wrappers
  const success = useCallback(
    (title, message) => showToast({ type: 'success', title, message }),
    [showToast],
  )
  const error = useCallback(
    (title, message) => showToast({ type: 'error', title, message, duration: 6000 }),
    [showToast],
  )
  const info = useCallback(
    (title, message) => showToast({ type: 'info', title, message }),
    [showToast],
  )
  const warning = useCallback(
    (title, message) => showToast({ type: 'warning', title, message }),
    [showToast],
  )

  return (
    <ToastContext.Provider value={{ showToast, success, error, info, warning, dismiss }}>
      {children}
      <ToastViewport toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  )
}
