# Changelog

All notable changes to this project are documented here.

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
