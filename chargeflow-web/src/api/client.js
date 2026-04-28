import axios from 'axios'
import { normalizeError } from './errors.js'
import { storage } from '../services/storage.service.js'

/**
 * Centralized axios client.
 *
 * Interceptors:
 *  - Request: attaches JWT, request-id, content-type
 *  - Response: unwraps `data`, normalizes errors into ApiError, handles 401 globally
 */
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:4000/api',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
})

// ─── Request interceptor ──────────────────────────────────────────────────
api.interceptors.request.use(
  (config) => {
    // Attach JWT if present
    const u = storage.get('cf_user')
    const token = u?.token
    if (token) config.headers.Authorization = `Bearer ${token}`

    // Lightweight request id for log correlation
    config.headers['X-Request-Id'] = `cf-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 8)}`

    // Strip nullish query params so the server doesn't see empty strings
    if (config.params) {
      config.params = Object.fromEntries(
        Object.entries(config.params).filter(([, v]) => v !== undefined && v !== null && v !== ''),
      )
    }

    return config
  },
  (err) => Promise.reject(normalizeError(err)),
)

// ─── Response interceptor ─────────────────────────────────────────────────
let onUnauthorized = null
export function setUnauthorizedHandler(handler) {
  onUnauthorized = handler
}

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const normalized = normalizeError(err)

    if (normalized.status === 401) {
      // Centralized auth-expiry hook (set by AuthProvider once it mounts)
      try {
        onUnauthorized?.()
      } catch {
        /* noop */
      }
    }

    return Promise.reject(normalized)
  },
)

/**
 * Tiny helper that unwraps the common `{ data, ... }` envelope and returns
 * a plain payload to call sites. Lets resource-level APIs stay terse.
 */
export async function request(method, url, { data, params, ...rest } = {}) {
  const res = await api.request({ method, url, data, params, ...rest })
  return res.data?.data ?? res.data
}
