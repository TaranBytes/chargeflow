import { storage } from './storage.service.js'

const KEY = 'cf_notifications'
const MAX_ITEMS = 100
const CHANGE_EVENT = 'cf_notifications:changed'

function uid() {
  return `n_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

function readAll() {
  return storage.get(KEY, [])
}

function writeAll(items) {
  storage.set(KEY, items.slice(0, MAX_ITEMS))
  window.dispatchEvent(new CustomEvent(CHANGE_EVENT))
}

function withinWindow(a, b, ms) {
  return Math.abs(new Date(a).getTime() - new Date(b).getTime()) <= ms
}

function asNotification(input) {
  return {
    id: input.id || uid(),
    type: input.type || 'system',
    title: input.title || 'Update',
    body: input.body || '',
    ts: input.ts || new Date().toISOString(),
    read: Boolean(input.read),
    dedupeKey: input.dedupeKey || null,
  }
}

export const notificationService = {
  list() {
    return readAll()
      .map(asNotification)
      .sort((a, b) => new Date(b.ts).getTime() - new Date(a.ts).getTime())
  },

  add(input, { dedupeWindowMs = 10000 } = {}) {
    const next = asNotification(input)
    const curr = this.list()
    if (next.dedupeKey) {
      const dup = curr.find(
        (n) =>
          n.dedupeKey === next.dedupeKey && withinWindow(n.ts, next.ts, dedupeWindowMs),
      )
      if (dup) return dup
    }
    writeAll([next, ...curr])
    return next
  },

  markAllRead() {
    writeAll(this.list().map((n) => ({ ...n, read: true })))
  },

  clearAll() {
    writeAll([])
  },

  subscribe(handler) {
    const wrapped = () => handler(this.list())
    window.addEventListener(CHANGE_EVENT, wrapped)
    return () => window.removeEventListener(CHANGE_EVENT, wrapped)
  },
}

