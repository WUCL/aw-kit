// src/confirmDialog.js
// Promise-based global confirm dialog (same emitter+host pattern as toast.js).
// Non-component code can call it too, and it behaves like window.confirm:
// `if (await confirm(...)) { ... }`
//
// Two-button (default): await confirm({ title, body, confirmLabel?, cancelLabel?, variant? })
//   → true (confirmed) / false (cancel / Esc / backdrop click)
// Multi-button: await confirm({ title, body, actions: [{ key, label, variant? }] })
//   → the chosen action's key; cancel / Esc / backdrop click → null
// variant maps to Button: 'primary' | 'secondary' | 'danger'.

let _handler = null

// Called by <ConfirmDialogHost> on mount; returns an unregister function.
export function registerConfirmHost(fn) {
  _handler = fn
  return () => { if (_handler === fn) _handler = null }
}

export function confirm(opts) {
  // No host mounted (shouldn't normally happen — the host is meant to be mounted once
  // at the app root) → safe default: two-button returns false, multi-button returns null.
  // Never treat "no UI" as "user confirmed" and trigger a destructive action.
  if (!_handler) return Promise.resolve(opts?.actions ? null : false)
  return new Promise(resolve => _handler(opts, resolve))
}
