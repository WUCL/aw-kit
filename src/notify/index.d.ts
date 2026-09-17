// Hand-written type declarations for aw-kit/notify's public API.
// This file is copied to dist/notify/index.d.ts at build time (not compiler-generated —
// the package is plain JS/JSX).

import type { ComponentType, ReactNode } from 'react'

export type ToastVariant = 'success' | 'warn' | 'error'
export type ButtonVariant = 'primary' | 'secondary' | 'danger'

export interface ToastAction {
  label: string
  onClick: () => void
}

export interface ToastOptions {
  /** ms until auto-dismiss; null = persistent (manual close only). Default: 3500 (success), 4000 (warn), null (error). */
  duration?: number | null
  /** Renders an in-toast button (e.g. "Undo"). Exempts the toast from dedupe and the 3-item eviction cap. */
  action?: ToastAction
  /** Dedupe/identity key. Defaults to the message text — pass a unique key (e.g. row id) when using `action`. */
  key?: string
}

export const toast: {
  success(message: string, opts?: ToastOptions): void
  /**
   * The user can fix this himself, right now: form validation, a required field,
   * a number out of range. Auto-dismisses after 4s.
   */
  warn(message: string, opts?: ToastOptions): void
  /**
   * The system could not do it, or the data may not have been saved.
   * **Persistent by design** — see src/toast.js.
   */
  error(message: string, opts?: ToastOptions): void
  /** Internal: used by <ToastHost>. Returns an unsubscribe function. */
  subscribe(handler: (item: unknown) => void): () => void
}

export interface ConfirmOptionsTwoButton {
  title: string
  body?: ReactNode
  confirmLabel?: string
  cancelLabel?: string
  variant?: ButtonVariant
  actions?: undefined
}

export interface ConfirmAction {
  key: string
  label: string
  variant?: ButtonVariant
}

export interface ConfirmOptionsMultiButton {
  title: string
  body?: ReactNode
  actions: ConfirmAction[]
}

/** Two-button form: resolves true (confirmed) / false (cancel, Esc, backdrop, or no host mounted). */
export function confirm(opts: ConfirmOptionsTwoButton): Promise<boolean>
/** Multi-button form: resolves the chosen action's key, or null (cancel, Esc, backdrop, or no host mounted). */
export function confirm(opts: ConfirmOptionsMultiButton): Promise<string | null>

/** Internal: used by <ConfirmDialogHost>. Returns an unregister function. */
export function registerConfirmHost(fn: (opts: unknown, resolve: (value: unknown) => void) => void): () => void

/**
 * Fallback CSS injector for setups that can't `import 'aw-kit/notify/style.css'` directly.
 * Idempotent — safe to call multiple times (including under React 18 Strict Mode).
 * Prefer the CSS import; this is blocked by a strict CSP (style-src without 'unsafe-inline').
 */
export function injectStyles(): void

/** Mount once at the app root. Renders toasts emitted via `toast.success()` / `toast.error()`. */
export const ToastHost: ComponentType<Record<string, never>>

/** Mount once at the app root. Renders dialogs requested via `confirm()`. */
export const ConfirmDialogHost: ComponentType<Record<string, never>>

// ── createNotify (project-level adapter) ────────────────────────────────

export interface NotifyToast {
  success(message: string, opts?: ToastOptions): void
  /** The user can fix this themselves, right now. Auto-dismisses. */
  warn(message: string, opts?: ToastOptions): void
  /** The system couldn't do it / data may not be saved. Persistent by design. */
  error(message: string, opts?: ToastOptions): void
}

export interface CreateNotifyOptions {
  /**
   * Error codes meaning "the database explicitly refused" (data untouched) → shown as `warn`.
   * Anything else (no code, unknown code, network failure) → `error`, because the row may or
   * may not have been saved. Which codes qualify is a project decision — see README.
   */
  refusalCodes: Iterable<string>
  /** Used when `toastFromError` is called without a fallback and the error carries no text. Default: '操作失敗'. */
  fallbackMessage?: string
}

export interface Notify {
  toast: NotifyToast
  /** Feed the caught error in; it picks warn vs error. Don't re-decide at call sites. */
  toastFromError(err: unknown, fallback?: string, opts?: ToastOptions): void
}

export function createNotify(options: CreateNotifyOptions): Notify

/**
 * Displayable text for "whatever was thrown": string → message → details → hint →
 * `錯誤代碼 {code}` → fallback. Handles both Error instances and Supabase's plain error objects.
 */
export function errText(err: unknown, fallback: string): string
