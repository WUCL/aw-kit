# aw-notify-kit

Zero-dependency toast + confirm-dialog emitter/host pair for React 18. Extracted from
[MH1491](https://github.com/chunglunwu/mh1491)'s notification system rebuild (2026-07).

## Install

```bash
npm install github:WUCL/aw-notify-kit#v0.1.2
```

## Quick Start

```jsx
// App root, mounted once
import { ToastHost, ConfirmDialogHost } from 'aw-notify-kit'
import 'aw-notify-kit/dist/style.css'

function App() {
  return (
    <>
      {/* ...your app... */}
      <ToastHost />
      <ConfirmDialogHost />
    </>
  )
}
```

```js
// Anywhere — components, hooks, or plain lib files
import { toast, confirm } from 'aw-notify-kit'

toast.success('已儲存')
toast.warn('請選擇設計師')   // the user can fix it → auto-dismisses
toast.error('儲存失敗')      // the data may not be saved → stays until dismissed

if (await confirm({ title: '確定要刪除？', variant: 'danger' })) {
  // ...
}
```

⚠️ **Only mount `<ToastHost />` and `<ConfirmDialogHost />` once each**, at the app root. Both
emitters are module-level singletons; a second mounted host will log a console warning. The
failure mode differs by component: `ToastHost` uses a multi-listener pub/sub, so duplicate hosts
will each render the same toast (visible duplication). `ConfirmDialogHost` uses a single-slot
handler, so the most recently mounted host wins and earlier ones stop receiving `confirm()`
calls (silent, not duplicated).

## CSS: use the stylesheet import, not `injectStyles()`

`import 'aw-notify-kit/dist/style.css'` is the supported path. It works everywhere, including
under a strict Content-Security-Policy (`style-src` without `'unsafe-inline'`).

`injectStyles()` (also exported) is a **fallback only**, for setups that genuinely cannot import
a CSS file. It injects a `<style>` tag at runtime, which strict CSP will block — components will
render unstyled. If you must use it:

```js
import { injectStyles } from 'aw-notify-kit'
injectStyles() // call once, e.g. at app entry — it's idempotent
```

## Theming

Override CSS custom properties (defaults shown):

```css
:root {
  --fbk-accent: #7d6299;
  --fbk-accent-hover: #634d7d;
  --fbk-toast-bg: #1f2937;
  --fbk-toast-fg: #f9fafb;
  --fbk-success: #4ade80;
  --fbk-warn: #fbbf24;
  --fbk-error: #f87171;
  --fbk-error-border: rgba(248, 113, 113, 0.35);
  --fbk-z-toast: 850;
  --fbk-z-dialog: 1000;
}
```

If your app has its own modal/overlay system, check `--fbk-z-dialog` (default `1000`) and
`--fbk-z-toast` (default `850`) don't collide with your own z-index scale.

## API

### `toast.success(message, opts?)`
Default: 3.5s auto-dismiss.

### `toast.warn(message, opts?)`
Default: 4s auto-dismiss. For anything **the user can fix himself, right now** — a required
field, an out-of-range number, "this slot is already taken, pick another".

### `toast.error(message, opts?)`
Default: persistent (`duration: null`), dismissed manually via the ✕ button.

**Picking between warn and error — one question: can the user fix this right now?**
If yes it is a prompt (`warn`); if the system could not do it, or the data may not have been
saved, it is a failure (`error`). 🔴 **error stays on screen on purpose**: a failed write that
disappears by itself leaves someone who looked away believing it saved. Don't give `error` a
default duration — reach for `warn` instead.

`opts`: `{ duration?: number|null, action?: { label, onClick }, key?: string }`
- `action` renders an in-toast button (e.g. "Undo") and **exempts the toast from dedupe and the
  3-item eviction cap** — pass a unique `key` (e.g. row id) so deleting several rows in a row
  doesn't collapse into a single undo button.

### `await confirm(opts)`
Two-button: `{ title, body?, confirmLabel?, cancelLabel?, variant? }` → `true | false`
Multi-button: `{ title, body?, actions: [{ key, label, variant? }] }` → chosen `key` | `null`

`variant`: `'primary' | 'secondary' | 'danger'`

If `<ConfirmDialogHost />` isn't mounted, `confirm()` resolves to the safe default (`false` for
two-button, `null` for multi-button) rather than ever resolving as "confirmed" — a destructive
action gated behind a missing dialog will never silently proceed.

## Decision tree (recommended usage)

This table encodes how MH1491 decided which channel to use for which situation. It's not
enforced by the package (aw-notify-kit is a mechanism, not a policy engine) — copy it into your
own project's conventions doc.

| # | Situation | Channel | Behavior |
|---|-----------|---------|----------|
| 1 | Success / confirmation (saved, completed, undo succeeded…) | `toast.success` | Dark gray, green dot, 3.5s auto-dismiss |
| 2 | Delete (single row, zero external references, destructive) | `toast.success` with `action: { label: 'Undo' }` | 8s (pauses on hover), clickable undo |
| 3 | Form validation error (required field, invalid amount) | **inline** field-level error where the layout allows it, otherwise `toast.warn` | Inline: persistent until fixed. Toast: amber dot, 4s auto-dismiss |
| 4 | Operation failure (save/delete/submit/batch failed) | `toast.error` | Red dot, never auto-dismisses, manual ✕ close |
| 5 | Real confirmation (logout, rename-sync, clearing form data) | `confirm({...})` | OK / Cancel |
| 6 | Multi-choice confirmation (apply to whole series vs. one item) | `confirm({ actions: [...] })` | Series / Single / Cancel |
| 7 | Informational gate ("N orders still reference this — can't delete") | `confirm({ actions: [{ key: 'ok', label: 'Got it' }] })` or inline | Esc/backdrop = "got it" |
| 8 | Undo itself failed (re-insert failed, including silent RLS-style failures) | `toast.error` | Never auto-dismisses, explicitly state "undo failed, data not restored" |

## Adapter recipes

### Undo-delete backed by your own database

This package deliberately does **not** ship a `undoDelete` helper — it's tied to your backend.
Compose it yourself with `toast`:

```js
import { toast } from 'aw-notify-kit'

async function deleteRowWithUndo(row, { deleteFn, restoreFn }) {
  await deleteFn(row.id)
  toast.success('已刪除', {
    key: row.id,
    duration: 8000,
    action: {
      label: '復原',
      onClick: async () => {
        try {
          await restoreFn(row)
          toast.success('已復原')
        } catch {
          toast.error('復原失敗，資料未還原')
        }
      },
    },
  })
}
```

## Migrating from an in-house toast/confirm implementation

Replacing an existing project's own toast/confirm module with this package is mostly mechanical,
but two mistakes are easy to make and produce **no error message** when you make them — they just
silently drop notifications or silently stop testing anything. Both surfaced during aw-notify-kit's
first real consumer migration (see `docs/consumer-reports/` if this repo has one).

1. **Find every call site by content, not by import-path depth.** A grep for one exact import
   string (e.g. `from '../lib/toast'`) will miss call sites at a different relative depth (e.g.
   `from './toast'` in a file that already lives inside `lib/`). Search by usage pattern instead,
   with a regex that doesn't care how deep the import is:

   ```bash
   grep -rn "toast\.\(success\|error\)(" src/
   grep -rEn "from ['\"].*[/'\"]toast['\"]" src/
   ```

   Any call site your survey misses keeps calling the *old* module's emitter. Once you swap the
   mounted `<ToastHost />` at the app root to this package's, the old emitter has zero
   subscribers — those calls become silent no-ops. No crash, no warning; the only symptom is
   "this toast just doesn't show up," discovered by a user or in manual testing, not by the tests.

2. **Update test mocks alongside the production code.** If your tests do
   `vi.mock('../lib/toast', ...)` or `jest.mock(...)`, and you change the *production* import to
   `aw-notify-kit` but forget to update the mock target to match, the mock stops intercepting
   anything. The real (now-unmounted, unsubscribed) call becomes a silent no-op, which usually
   doesn't throw — so the test keeps passing green, but it's no longer asserting anything real.
   Grep your test suite for mocks of the old module path as part of the same pass, not as an
   afterthought.

## Development

```bash
npm install
npm test
npm run build   # outputs dist/aw-notify-kit.js + dist/style.css — commit dist/ before tagging a release
```

**Do not add a `"prepare"` script to package.json.** `npm install github:...` runs `prepare` on
the consumer's machine, where this package's devDependencies (including `vite`) are not
installed — it would break every consumer's install. Build locally, commit `dist/`, then tag.

## Versioning

Install a specific tag: `npm install github:WUCL/aw-notify-kit#v0.1.2`. Tags can technically be
moved; if you need reproducibility guarantees, pin a commit hash instead:
`npm install github:WUCL/aw-notify-kit#<commit-sha>`.
