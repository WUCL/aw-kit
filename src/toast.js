// src/toast.js
// Global toast emitter. Any code (including non-component lib files) can call
// toast.success()/error(); subscribed hosts (e.g. <ToastHost>) render the UI.
//
// Three levels, distinguished by "can the user fix this right now?":
//   success  it worked                                    3500ms, auto-dismiss
//   warn     the user can fix it himself right now         4000ms, auto-dismiss
//            (form validation, required field, bad number)
//   error    the system could not do it / the data may     persistent, manual close
//            not have been saved (RPC threw, write rejected, load failed)
//
// 🔴 error stays on screen on purpose: if a failed write disappears by itself, someone
//    who looks away never learns the record was not saved. Do not "fix" that by adding
//    a default duration to error — use warn for anything that is merely a prompt.
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
  // ⚠️ The default dedupe key includes the TYPE, not just the message. Without it,
  // emitting the same sentence as warn and then as error within 300ms silently drops
  // the error — and the error is the one that must never be swallowed. An explicit
  // `key` still wins, so callers that dedupe by row id are unaffected.
  const dedupeKey = key ?? `${type}:${message}`
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
  warn(message, opts) {
    emit('warn', message, { duration: 4000, ...opts })
  },
  error(message, opts) {
    emit('error', message, { duration: null, ...opts })
  },
  subscribe(handler) {
    _listeners.add(handler)
    return () => _listeners.delete(handler)
  },
}
