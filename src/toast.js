// src/toast.js
// Global toast emitter. Any code (including non-component lib files) can call
// toast.success()/error(); subscribed hosts (e.g. <ToastHost>) render the UI.
//
// duration: number = ms until auto-dismiss; null = persistent (error default, manual close only).
// action: { label, onClick } → rendered as an in-toast button (e.g. "Undo"); exempts from dedupe.
// key: dedupe/identity key, defaults to message; pass a unique key (e.g. row id) when using
//      action so that deleting two rows in a row doesn't collapse into one undo button.

const _listeners = new Set()
let _seq = 0
const _recent = new Map() // dedupeKey -> last emit timestamp

const DEDUPE_MS = 300

function emit(type, message, { duration = 3500, action = null, key = null } = {}) {
  const dedupeKey = key ?? message
  if (!action) {
    const now = Date.now()
    const last = _recent.get(dedupeKey)
    if (last != null && now - last < DEDUPE_MS) return
    _recent.set(dedupeKey, now)
  }

  const item = { id: ++_seq, type, message, duration, action, key: dedupeKey }
  _listeners.forEach(fn => fn(item))
}

export const toast = {
  success(message, opts) {
    emit('success', message, opts)
  },
  error(message, opts) {
    emit('error', message, { duration: null, ...opts })
  },
  subscribe(handler) {
    _listeners.add(handler)
    return () => _listeners.delete(handler)
  },
}
