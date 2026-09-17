// src/notify/createNotify.js — project-level notify adapter factory.
//
// Extracted from inknock `src/shared/ui/notify.ts` (2026-09-15) + `src/shared/errors.ts`.
// The point of this layer: **the warn/error severity rule must have exactly one home.**
// Spread across 170 call sites, each `catch` re-interprets the boundary and they drift.
//
// ── Severity rule ─────────────────────────────────────────────────────────
//   success  it got done                                   auto-dismiss (toast default)
//   warn     **the user can fix it themselves, right now**  auto-dismiss
//            (form validation, quantity over stock, required field missing…)
//   error    **the system couldn't do it / data may not be saved**   persistent, manual close
//            (RPC threw, write refused, load failed…)
//
// `toastFromError(err, fallback)` decides between warn and error by the error *code*:
//   "the database explicitly refused me" (a code in `refusalCodes`) → warn — the message is
//   ours, the data is untouched; "I don't know what the database did" (no code / unknown code,
//   e.g. network down, PostgREST gone, unexpected throw) → error — that row may or may not
//   have been saved, so the notice must stay on screen.
//
// `refusalCodes` is a **consumer decision**, not a package default: which Postgres error codes
// count as "explicit refusal" depends on how the project's RPCs raise. inknock's list is in the
// README as a starting point (23514 check_violation, 23505 unique, 23503 fk, 23P01 exclusion,
// 42501 insufficient_privilege, 22003 out_of_range, 22023 invalid_parameter, P0001 raise default).
import { toast as rawToast } from './toast.js'

/**
 * Turn "whatever was thrown" into a displayable message; fall back when nothing useful.
 *
 * Why not `instanceof Error`: `@supabase/postgrest-js` only constructs `PostgrestError` under
 * `.throwOnError()`. The usual `const { error } = await sb.rpc(...)` yields a **plain object**
 * `{ message, details, hint, code }`, and `if (error) throw error` throws exactly that. Checking
 * the type would mask every carefully written `raise exception` message behind the fallback.
 *
 * Order: string itself → message → details → hint → `錯誤代碼 {code}` → fallback.
 */
export function errText(err, fallback) {
  if (typeof err === 'string' && err.trim()) return err
  if (typeof err === 'object' && err !== null) {
    if (typeof err.message === 'string' && err.message.trim()) return err.message
    if (typeof err.details === 'string' && err.details.trim()) return err.details
    if (typeof err.hint === 'string' && err.hint.trim()) return err.hint
    if (typeof err.code === 'string' && err.code.trim()) return `錯誤代碼 ${err.code}`
  }
  return fallback
}

function errCode(err) {
  if (typeof err === 'object' && err !== null && typeof err.code === 'string' && err.code.trim()) {
    return err.code.trim()
  }
  return null
}

/**
 * @param {{ refusalCodes: Iterable<string>, fallbackMessage?: string }} options
 */
export function createNotify({ refusalCodes, fallbackMessage = '操作失敗' }) {
  const refusals = new Set(refusalCodes)

  const toast = {
    success(message, opts) { rawToast.success(message, opts) },
    /** The user can fix this themselves, right now. Auto-dismisses. */
    warn(message, opts) { rawToast.warn(message, opts) },
    /** The system couldn't do it / data may not be saved. **Persistent by design.** */
    error(message, opts) { rawToast.error(message, opts) },
  }

  /**
   * Feed the caught error in; it picks warn vs error. Don't re-decide at the call site.
   * ⚠️ Inside this function call `toast.warn`/`toast.error` directly — a past mechanical
   * rename in inknock rewrote the `error` branch into `toastFromError(...)` = infinite recursion,
   * silent under tsc/build/lint, only caught by the severity test.
   */
  function toastFromError(err, fallback = fallbackMessage, opts) {
    const code = errCode(err)
    const message = errText(err, fallback)
    if (code && refusals.has(code)) toast.warn(message, opts)
    else toast.error(message, opts)
  }

  return { toast, toastFromError }
}
