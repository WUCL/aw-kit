# Changelog

All notable changes to this project are documented here.

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
