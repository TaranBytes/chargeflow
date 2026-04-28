// Tiny localStorage wrapper for safe JSON I/O.
export const storage = {
  get(key, fallback = null) {
    try {
      const raw = localStorage.getItem(key)
      return raw ? JSON.parse(raw) : fallback
    } catch {
      return fallback
    }
  },
  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch {
      /* quota / private mode */
    }
  },
  remove(key) {
    localStorage.removeItem(key)
  },
}
