# aw-kit

Allen Wu's shared front-end kit, consumed via git tag. One package, **subpath exports only**
(there is no root `aw-kit` import — every import names what it wants):

| Subpath | What | Needs |
|---|---|---|
| `aw-kit/notify` | Zero-dependency toast + confirm-dialog emitter/host pair, plus `createNotify` adapter factory | React ≥ 18 |
| `aw-kit/notify/style.css` | The notify stylesheet | — |
| `aw-kit/eslint-rules` | Flat-config ESLint plugin: `verified-supabase-write`, `no-hardcoded-design-token`, `no-inline-date-format` | ESLint ≥ 9 |
| `aw-check-rpc-types` (bin) | Ratchet CLI against hand-written Supabase RPC return types | Node ≥ 18 |

Everything here was extracted from mechanisms already running in production
([MH1491](https://github.com/chunglunwu/mh1491) 2026-07, inknock 2026-09); nothing was designed
from scratch for the package. This repo used to be `aw-notify-kit` (≤ v0.1.3).

## Install

```bash
npm install github:WUCL/aw-kit#v0.2.1
```

## Migrating from `aw-notify-kit` ≤ 0.1.3

Two mechanical edits, no behaviour change:

```bash
sed -i '' "s#from 'aw-notify-kit'#from 'aw-kit/notify'#g" $(grep -rl "aw-notify-kit" src tests)
sed -i '' "s#aw-notify-kit/dist/style.css#aw-kit/notify/style.css#g" $(grep -rl "aw-notify-kit" src)
```

then `npm install github:WUCL/aw-kit#v0.2.1` and drop the old dependency. The root import is
gone on purpose — a stale `from 'aw-notify-kit'` fails to resolve rather than silently working
against an old copy. Don't forget `vi.mock('aw-notify-kit', …)` in tests (see
"Migrating from an in-house implementation" below for why a stale mock target stays green).

---

# `aw-kit/notify`

## Quick Start

```jsx
// App root, mounted once
import { ToastHost, ConfirmDialogHost } from 'aw-kit/notify'
import 'aw-kit/notify/style.css'

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
import { toast, confirm } from 'aw-kit/notify'

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

`import 'aw-kit/notify/style.css'` is the supported path. It works everywhere, including
under a strict Content-Security-Policy (`style-src` without `'unsafe-inline'`).

`injectStyles()` (also exported) is a **fallback only**, for setups that genuinely cannot import
a CSS file. It injects a `<style>` tag at runtime, which strict CSP will block — components will
render unstyled. If you must use it:

```js
import { injectStyles } from 'aw-kit/notify'
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

### `createNotify({ refusalCodes, fallbackMessage? })`

The project-level adapter. Extracted from inknock's `shared/ui/notify.ts` after 170+ call sites
each re-decided the warn/error boundary in their own `catch` and drifted. It returns
`{ toast, toastFromError }`; make **one** instance in `src/shared/notify.ts` and import that
everywhere — never the raw `toast` from this package.

```ts
// src/shared/notify.ts — the only place the severity rule lives
import { createNotify } from 'aw-kit/notify'

export const { toast, toastFromError } = createNotify({
  // Postgres error codes meaning "the database explicitly refused; data untouched".
  // This is a project decision, not a package default — inknock's list, as a starting point:
  refusalCodes: [
    '23514', // check_violation   — business rules raised in the RPC
    '23505', // unique_violation
    '23503', // foreign_key_violation
    '23P01', // exclusion_violation — overlapping time slots
    '42501', // insufficient_privilege — RLS / assert_* refused (data untouched, hence warn)
    '22003', // numeric_value_out_of_range
    '22023', // invalid_parameter_value
    'P0001', // raise exception without an explicit errcode
  ],
  fallbackMessage: '操作失敗',
})
```

```ts
try { await saveOrder(o) } catch (err) { toastFromError(err, '儲存失敗') }
```

`toastFromError(err, fallback?, opts?)` — "the database explicitly refused me" (a code in
`refusalCodes`) → `toast.warn`, showing the RPC's own message; "I don't know what the database
did" (no code, unknown code, network failure) → `toast.error`, persistent, because that row may
or may not have been saved. **Don't re-decide at the call site.**

`errText(err, fallback)` is also exported: string → `message` → `details` → `hint` →
`錯誤代碼 {code}` → fallback. It deliberately does not check `instanceof Error` —
`@supabase/postgrest-js` throws a **plain object** `{ message, details, hint, code }` unless you
used `.throwOnError()`, and checking the type would hide every `raise exception` message behind
the fallback.

## Decision tree (recommended usage)

This table encodes how MH1491 decided which channel to use for which situation. It's not
enforced by the package (aw-kit/notify is a mechanism, not a policy engine) — copy it into your
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
import { toast } from 'aw-kit/notify'

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
silently drop notifications or silently stop testing anything. Both surfaced during this package's
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
   `aw-kit/notify` but forget to update the mock target to match, the mock stops intercepting
   anything. The real (now-unmounted, unsubscribed) call becomes a silent no-op, which usually
   doesn't throw — so the test keeps passing green, but it's no longer asserting anything real.
   Grep your test suite for mocks of the old module path as part of the same pass, not as an
   afterthought.

---

# `aw-kit/eslint-rules`

```js
// eslint.config.js
import awKit from 'aw-kit/eslint-rules'

export default [
  // ...your parser / plugins...
  awKit.configs.recommended,   // all three rules as `error`
  {
    // the project's own formatter is the one legitimate place for the date-string shape
    files: ['src/shared/format.ts'],
    rules: { 'aw-kit/no-inline-date-format': 'off' },
  },
]
```

Named rules, not `no-restricted-syntax` selectors: flat config replaces a same-named rule
**wholesale** when a later block sets it again, so inknock's three token selectors silently
died in `src/features/**` the day a fourth selector was added there. Named rules can't be
overridden by accident, and each can carry its own severity and options.

### `aw-kit/verified-supabase-write` (`problem`)

Under RLS, an `update`/`delete` the policy refuses returns `error = null` with 0 rows affected.
The only way to notice is to fetch the affected rows back, so this rule flags any Supabase
`update`/`delete` chain that neither ends in `.select()`, nor is passed to `verifyWrite(...)`
(directly, or via a variable). Bulk writes that legitimately touch 0 rows: add
`eslint-disable-next-line` **with the reason** — the forced comment is the point.

Options: `{ clientNames?: string[] /* default ['supabase'] */, verifyFnName?: string /* default 'verifyWrite' */ }`.
Any chain containing `.from()` counts as Supabase regardless of `clientNames` (that's how
`const db = supabase` aliases get caught). TS wrappers (`as`, `satisfies`, `!`) are transparent
in both directions — `(q.update(v) as any).eq(...).select()` passes, `(await q.update(v)) as any`
does not.

Known and deliberate limits: it guards against *forgetting*, not against *circumventing*. Shadowing
`verifyWrite` or awaiting first and calling it later won't be caught; the named disable comment is
the front door for those.

### `aw-kit/no-hardcoded-design-token` (`suggestion`)

Object `Property` with key `fontSize` / `borderRadius` and a numeric literal value → report;
`fontWeight: 700 | 800` → report (CJK caps at 600 — Latin/numeric exceptions get a disable
comment with the reason). String values (`'14px'`, `'50%'`) and expressions are out of scope.
Options: `{ fontSize?, borderRadius?, fontWeight?: boolean }` to switch a category off.

### `aw-kit/no-inline-date-format` (`suggestion`)

A **shape guard, not a complete ban**: one `TemplateLiteral` containing both a `Date` getter call
(`getFullYear`…`getSeconds`) and a `.padStart(...)` call. Only `padStart` (`` `${h}:00` ``) or only
getters (`` `${d.getFullYear()} 年` ``) are legal and untouched. Blind spots — `padStart` hidden in a
helper, or getters stored in a variable first — are documented and left to review: widening the
selector drowns the signal in false positives. Options: `{ message?: string }` to point the report
at your formatter; the formatter file itself is excluded via `files`/`ignores` in your config, not
via a whitelist in this package.

---

# `aw-check-rpc-types` (bin)

```jsonc
// package.json
"scripts": { "check:rpc-types": "aw-check-rpc-types --root src/infrastructure/supabase --baseline scripts/check-rpc-types.baseline.json" }
```

In every `*.ts` under `--root` (recursive, `node_modules` skipped) that calls `.rpc('…')`, an
`export interface X {` / `export type X = {` that is then used as the RPC's return
(`as X[]`, `as unknown as X`, `Promise<X>`) is a hand-copied return type — it must derive from
the generated `Database['public']['Functions']['<rpc>']['Returns']` instead. A
`// rpc-type-ok: <reason>` line directly above the declaration exempts it.

Ratchet: the baseline lists known offenders as `<path relative to --root>:<Name>`. New hits →
exit 1; baseline entries that no longer hit → exit 1 asking you to shrink it
(`--update-baseline` rewrites it). **The baseline only shrinks**: `--update-baseline` refuses
(exit 1) while there are new hits, so a flag can't launder a fresh violation into "known debt" —
growing it means editing the file by hand, where review sees it. First adoption:
`--init-baseline` records the current state, allowed only when the baseline file doesn't exist
yet. Exit 2 = bad arguments, missing root, or `--init-baseline` over an existing file.

Migrating from inknock's `scripts/check-rpc-types.mjs`: keys there were prefixed with the scan
directory; delete the old baseline and run `--init-baseline` once to regenerate.

---

## Development

```bash
npm install
npm test        # vitest: notify (jsdom), eslint-rules (RuleTester w/ TS parser), bin (subprocess + fixtures)
npm run build   # outputs dist/notify/{index.js,index.d.ts,style.css} — commit dist/ before tagging a release
```

`aw-kit/eslint-rules` and the bin are plain Node ESM served from `src/eslint-rules/` and `bin/`;
only notify is bundled.

**Do not add a `"prepare"` script to package.json.** `npm install github:...` runs `prepare` on
the consumer's machine, where this package's devDependencies (including `vite`) are not
installed — it would break every consumer's install. Build locally, commit `dist/`, then tag.

## Versioning

Install a specific tag: `npm install github:WUCL/aw-kit#v0.2.1`. Tags can technically be
moved; if you need reproducibility guarantees, pin a commit hash instead:
`npm install github:WUCL/aw-kit#<commit-sha>`.
