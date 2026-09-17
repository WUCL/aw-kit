# Changelog

All notable changes to this project are documented here.

## [0.2.1] — 2026-09-17

### Fixed

- **`aw-check-rpc-types` now scans `--root` recursively** (`node_modules` skipped). v0.2.0 only
  listed the top-level `*.ts`, so a hand-written RPC return type in any subdirectory passed the
  gate silently. Baseline keys are still paths relative to `--root` (posix separators), so a
  nested hit reads `orders/queries/orders.ts:OrderRow`. Found by the aw-admin_starter
  `/codex-full-review` (2026-09-17, P1); regression fixture `tests/bin/fixtures/rpc-types/nested/`.

## [0.2.0] — 2026-09-17

**Renamed `aw-notify-kit` → `aw-kit`** and widened from one mechanism to a kit. Driven by the
`aw-admin_starter` plan (aw-cc_workflow `docs/plans/2026-09-17-aw-admin_starter.md`): the starter
needs notify, the Supabase-safety lint rules and the RPC-type gate from one pinned dependency.

### Breaking

- **Subpath exports only; the root `.` export is gone.** `from 'aw-notify-kit'` →
  `from 'aw-kit/notify'`; `aw-notify-kit/dist/style.css` → `aw-kit/notify/style.css`.
  Deliberate: a stale import fails to resolve instead of silently working against an old copy.
  README has the two-line sed.
- `dist/aw-notify-kit.js` → `dist/notify/index.js`; console warnings now prefixed
  `[aw-kit/notify]`.
- `react` / `react-dom` peers are now **optional** (a lint-only consumer needs neither);
  `eslint >= 9` added as an optional peer.

### Added

- **`aw-kit/notify`: `createNotify({ refusalCodes, fallbackMessage? })`** → `{ toast, toastFromError }`,
  and `errText(err, fallback)`. Ported from inknock `shared/ui/notify.ts` + `shared/errors.ts`.
  `toastFromError` puts the warn/error boundary in one place: a code in `refusalCodes` = the DB
  explicitly refused, data untouched → `warn`; anything else = unknown whether the row saved →
  persistent `error`. `refusalCodes` is a consumer decision (inknock's list is in the README as a
  starting point, not a default). Every refusal code is tested individually.
- **`aw-kit/eslint-rules`** flat-config plugin (`awKit.configs.recommended`, all `error`):
  - `verified-supabase-write` — ported from mh1491. Now TS-aware: `as` / `satisfies` / `!` are
    transparent while walking the chain (the verbatim JS rule false-positived on four TS shapes
    under the TS parser — proven by RuleTester before the change), and optional chaining
    (`ChainExpression`) is transparent too. Options `clientNames`, `verifyFnName`.
  - `no-hardcoded-design-token` — inknock's three `no-restricted-syntax` selectors as a named
    rule (flat config replaces same-name rules wholesale; the selectors silently died in
    `src/features/**` when a fourth was added there). Also catches non-integer literals.
  - `no-inline-date-format` — Date getter + `padStart` in one template literal. A shape guard
    with documented blind spots; `message` option points at the project's formatter, no
    whitelist file in the package.
- **`aw-check-rpc-types` bin** — inknock's `scripts/check-rpc-types.mjs` with `--root` and
  `--baseline` parameterised so negative fixtures never enter a real scan path. Baseline keys
  are relative to `--root` (delete the old file and `--init-baseline` once when migrating).
  Unlike inknock's script, `--update-baseline` refuses to write while there are new hits — the
  ratchet really only shrinks (Codex review). Exit 0/1/2. Tested by subprocess against seven
  isolated fixture directories.

## [0.1.3] — 2026-09-15

Adds a third toast level. Driven by a real consumer (inknock): of ~173 `toast.error` call sites,
**78 were not failures at all** — they were form prompts ("please pick a designer") that, because
`error` is persistent by design, sat on screen until the user dismissed them by hand.

- **Added `toast.warn(message, opts?)`** — 4s auto-dismiss, amber dot
  (`--fbk-warn` / `--fbk-warn-border`), `role="alert"` like error.
  The rule: *can the user fix this right now?* → yes: `warn`; no, or the data may not have been
  saved: `error`. `error` remains persistent by design and that is not a bug.
- Repeated identical warns collapse into one toast with a ×N counter, same as errors.
- **Fixed: the default dedupe key ignored the toast type.** Emitting the same sentence as
  `warn` and then as `error` within the 300ms dedupe window silently dropped the error — the one
  message that must never be swallowed. The default key is now `type:message`; an explicit `key`
  still wins, so callers deduping by row id are unaffected.
- `warn` is click-to-close on the toast body (it auto-dismisses anyway); `error` still requires
  the ✕, so a stray click can't discard a failure notice.

## [0.1.2] — 2026-07-12

Docs-only release, informed by mh1491's first real consumer migration
(`docs/consumer-reports/2026-07-12-mh1491-migration.md`).

- Added a "Migrating from an in-house toast/confirm implementation" README section covering the
  two silent-failure pitfalls found during migration: (1) grepping for one fixed import-path
  depth misses call sites at other relative depths — search by usage pattern instead; (2) test
  `vi.mock`/`jest.mock` targets must be updated alongside production imports, or mocks silently
  stop intercepting and tests keep passing green without asserting anything real.

## [0.1.1] — 2026-07-12

Fixes found in a final pre-install review pass.

- Fixed install commands in README/CHANGELOG pointing at the wrong GitHub org
  (`chunglunwu/aw-notify-kit` → `WUCL/aw-notify-kit`).
- Fixed `injectStyles()`: the fallback only carried `:root` CSS variables, not the actual
  component rules, so consumers using it got unstyled toasts/dialogs. Now imports
  `styles.css` via Vite's `?raw` suffix instead of a hand-duplicated string, so the fallback
  can't drift out of sync with the real stylesheet again.
- Doc corrections: undo-toast pause behavior is mouse-hover only (not focus); added the
  missing `--fbk-error-border` theming token to the README table; corrected a stale
  `package-lock.json` note in CLAUDE.md.

## [0.1.0] — 2026-07-12

Initial extraction from [MH1491](https://github.com/chunglunwu/mh1491)'s notification system.

- `toast` / `confirm` emitters, `ToastHost` / `ConfirmDialogHost` React hosts, self-contained
  `Button`, `fbk-*` themeable stylesheet, `injectStyles()` CSP-unfriendly fallback.
- Dropped Tailwind and MH1491's internal `Button` dependency — CSS variables + package-local
  `Button.jsx` instead.
- Added React 18 Strict Mode refcount guards to both hosts (a boolean flag mis-detects when the
  two hosts unmount out of order) and a focus-restore guard to `ConfirmDialogHost`.
- Hand-written TypeScript declarations (`dist/index.d.ts`) for the public API.
- MIT licensed.
