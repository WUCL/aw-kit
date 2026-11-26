# Changelog

All notable changes to this project are documented here.

## [0.13.0] — 2026-11-27

### Added

- `aw-kit/gates/controls-gate`: `scanHit(file, text, { extraTags })` also checks the consumer's own self-drawn button components (e.g. `BlockButton`, whose look and hit area come entirely from the caller's `style`). Previously a consumer had to rewrite the source text (`<BlockButton` → `<button`) before scanning, which reported the wrong tag name and depended on the rewrite keeping JSX paired. Hits report the real tag name. Invalid names (non-array, non-JSX identifiers) throw `TypeError` instead of silently checking nothing. **Baseline migration**: keys built from `tag` (e.g. `hit <button> file` from a rewrite) become `hit <BlockButton> file` — rename those baseline entries by hand when switching (a shrink-only `--update-baseline` cannot). Boundaries: aliased imports, reassignment and differently written member names are not matched.

## [0.12.0] — 2026-11-20

### Added

- `aw-kit/ui/switch-row`: `SwitchRow` — a whole-row switch (title + optional description／state text + `Switch`). The row is a `<label>`, so clicking anywhere toggles once; the accessible name is the title only (`aria-labelledby` — a wrapping label's native name would also swallow the description), the description is `aria-describedby`, `stateText` is `aria-hidden` so the name never changes with the state. `tone="warning"` (warning colours only while on, with `framed`), `framed` (own border + sunken background for a standalone row), `inset` (horizontal padding 18／14 mobile; `false` when the container already pads).
- `aw-kit/ui/switch`: `aria-label`／`aria-labelledby`／`aria-describedby` props. **Breaking (types)**: a `Switch` must have a fixed name — one of `aria-label`, `aria-labelledby` or `id` (for `<label htmlFor>`) is required by the prop types, so a nameless switch, `aria-label={undefined}`, or a bare spread no longer compiles. A wrapping `<label>` alone does not count (its text is often a state word such as "營業／公休", so the name would change with the state).
- `aw-kit/vite`: `awKitOptimizeDeps(own?)` for consumers' `vite.config` — `exclude: ['aw-kit']` + `extensions: ['.tsx']`. Without it Vite 6's dev server loads aw-kit's `.tsx` sources under two URLs (with and without `?v=`), giving two React contexts and a "no ThemeProvider" error on `npm run dev` only (build, vitest and CI never see it; `npm link` hides it). Merges the consumer's own `optimizeDeps`.
- `aw-kit/gates/pin`: `checkPin` compares the commit recorded in package-lock (`resolved`) with the commit the tag points to now (`readPinState(root, { remote: true })`, `fetchTagCommit(tag)`) — a re-pointed tag with the same version number used to pass all checks while `npm ci` silently installed the old commit. A deleted tag (`tagMissing`) is reported. A failed lookup (`tagCommit: null`: offline, rate limit, no git; `fetchTagCommit` retries 3 times) is a note locally and a problem with `strict: true` — turn on `remote` and `strict` in CI only (a missing check must not pass silently); locally, say that the check was skipped.

### Fixed

- `aw-kit/ui/header-dropdown`: on desktop／iPad the dropdown is capped at the viewport bottom (−16px) and scrolls inside; long search results used to run off-screen with the last rows unreachable on short (iPad landscape) viewports. Measured from the dropdown box itself (works when mounted open; re-measured on resize and scroll). The desktop box is now a flex column; new `HeaderDropdownScrollArea({ maxHeight })` marks the one scrolling region (e.g. a notification list between a title row and a footer link): it shrinks when the box hits the viewport bottom, so header and footer never scroll away, and it absorbs `MenuSeparator`'s `-mx-1` so no horizontal scroll appears. Without it the whole box scrolls as before.

## [0.11.0] — 2026-11-20

Closes inknock ADR 0002 step 2 (batch E2): everything inflorify needs to adopt `aw-kit/ui` now lives in aw-kit.

### Added

- `aw-kit/ui/styles/globals.css`: the global classes aw-kit/ui components rely on — `focus-ring`／`focus-ring-inset`, `hit-area` (44px hit area, also for notify's confirm buttons), `hide-scrollbar`, `@keyframes skeleton-shimmer` — moved from inknock `src/index.css`. Load it once at the root (after your global CSS, before Tailwind). The focus fallback is now `var(--ds-accent-600, currentColor)` (brand layer, then always visible) instead of inknock's hex. The confirm buttons get the `position: relative` their `::after` hit area needs (inknock had it in its own CSS; without it the `::after` covers the whole dialog panel and the last button swallows every click). inknock's built CSS differs only by this relocation (every other rule byte-identical in order). `tests/ui/globals-css.test.js` checks every global class the components use is defined.
- `aw-kit/eslint-rules`: `uiLibraryPatterns(message, { extraPrimitivePaths })` and `bareCnPath(message?)` — "UI low-level imports (primitives, react-aria, lucide) only in the component layer" and "no bare `cn`", moved from inknock's ESLint config; RuleTester negatives in `tests/eslint-rules/imports.test.js`.
- `aw-kit/gates/pin`: `readPinState(root)` + `checkPin()` — the consumer pins aw-kit to a `WUCL/aw-kit` tag (forks and other repos fail) and package.json／package-lock／installed version agree; `dependencies` or `devDependencies`; npm link skips only the installed-version check, with a note.
- Type declarations for every `aw-kit/gates/*` module (`types` export condition); `tests/gates/types-check.ts` (in `test:types`) exercises them the way a consumer calls them.

## [0.10.0] — 2026-11-19

### Added

- `aw-kit/gates/*` (inknock ADR 0002 batch E1): the UI gate logic moved from inknock's `check:ui`／`check:style`／`check:controls`／`check:terms` scripts — pure functions, project specifics passed in. `class-gate` (page className rules, component-layer font sizes, alias／display clash, `@source` parsing), `style-gate` (`createStyleRules({ palette, owners, tagOwners, isComponentLayer })`, `UI_OWNERS`／`uiOwners(prefix)` for aw-kit/ui's own native-control and tag owners), `controls-gate` (hard-coded control heights, missing `hit-area`), `terms-gate` (`scanTerms` with a product dictionary — throws without one), `sources` (file listing, aw-kit/ui labels, ratchet baseline), `is-main` (the single copy; inknock's is deleted). Consumers call them with their own token names, palette, dictionary and scope; inknock's gate output is identical before and after (clean tree and a probe hitting every rule).
- `npm run check:gates` (CI runs it through `tests/gates/self-scan.test.js` in `npm test`): aw-kit/ui is scanned by aw-kit itself — font sizes／design rules／control heights over every `src/ui` file. Before, only consumers scanned it, so a violation surfaced only after re-pinning and an inflorify-only setup would not scan it at all. `tests/gates/` holds the moved negative-case lists plus a fixed scope test and a positive control (a probe in a copy of `src/ui` makes the CLI exit 1).
- Optional peers `typescript >=5` and `postcss ^8` — **required when you use the gate modules that parse code**: `class-gate` (typescript + postcss), `controls-gate` and `terms-gate` (typescript); `style-gate`, `sources` and `is-main` need neither; optional only because `aw-kit/ui`／`notify`／`panel` consumers don't need them.

### Removed

- `scripts/is-main.mjs` (moved to `src/gates/is-main.js`, exported as `aw-kit/gates/is-main`).

## [0.9.0] — 2026-11-19

### Added

- `aw-kit/ui` batch D3 (inknock ADR 0002): the field／menu／dialog chain moved verbatim from inknock `src/shared/ui` — `use-input-style`, `field-state`, `input`, `number-input`, `textarea`, `select`, `sort-select`, `tooltip`, `info-tip`, `form-field`, `use-dropdown-menu`, `menu-row`, `overflow-menu`, `header-dropdown`, `combobox`, `modal`, `prompt-dialog`, `filter-bar`, `pagination`, `use-collapsible-search`. inknock's built CSS is byte-identical before and after.
- No router dependency: `MenuRow` takes a `linkAs` component for `to` links and `HeaderDropdown` takes a `routeKey` (closes when it changes) — consumers inject their router (inknock wraps both in `src/shared/ui`). Depending on `react-router-dom` v6 directly would block consumers on react-router v7 and, under `npm link`, load a second router instance.
- 15 component tests moved with them; `tests/ui/helpers/test-theme.tsx` (test-only brand, `renderWithTheme`); `tests/setup.js` (Testing Library cleanup — globals are off).

### Changed

- Dev dependency `jsdom` 25 → 29.1.1 (inknock's version; jsdom 25 lacks the PointerEvent support the moved Tooltip tests rely on).
- All `tests/ui` files (not only the moved ones) are type-checked with `tests/ui/tsconfig.json`: every strict flag of `tsconfig.ui.json` except `noUncheckedIndexedAccess` (consumers type-check `src/ui`, never the tests). `src/ui` stays fully strict.

## [0.8.0] — 2026-11-19

### Added

- `aw-kit/ui/theme-context` (inknock ADR 0002 batch D2): `ThemeProvider({ theme })` and `useTheme()`. There is no default theme — `useTheme()` throws when no provider is mounted, so a missing provider fails loudly instead of rendering another brand's colours. The provider also keeps the `--focus-ring` CSS variable in step with `accent600`. Projects wrap their root (and tests) with `<ThemeProvider theme={createTheme()}>`.
- 19 theme-reading components moved verbatim from inknock `src/shared/ui`: `annotated-section`, `condensed-row`, `data-table`, `em`, `export-button`, `filter-toggle`, `link-button`, `nav-count-badge`, `page-header`, `panel-action-row`, `panel-kpis`, `panel-section`, `rank-list`, `section-title`, `skeleton`, `table-shell`, `tabs`, `stat-card`, `timeline-list`. inknock's built CSS is byte-identical before and after.

## [0.7.0] — 2026-11-19

### Added

- `aw-kit/ui` batch D1 (inknock ADR 0002): leaf wrapper components moved verbatim from inknock `src/shared/ui` — `button`, `icon-button`, `card`, `checkbox`, `switch`, `chip`, `removable-chip`, `callout`, `empty-state`, `pressable`, `clamp-text`, `close-icon`, `field-description`, `use-trailing-dot`. They depend only on `aw-kit/ui` modules and its peers (`checkbox` uses `lucide-react` icons; no theme context yet). inknock's built CSS is byte-identical before and after.
- Tests moved with them: `button`, `pressable`, `callout` (`tests/ui/helpers/match-media.ts` for jsdom).

## [0.6.0] — 2026-11-19

### Added

- `aw-kit/ui` batch C (inknock ADR 0002), moved from inknock with class strings unchanged (inknock's built CSS is byte-identical before and after the move):
  - `aw-kit/ui/primitives/*` (16 files: alert, badge, button, card, checkbox, chip, dialog, dropdown-menu, empty, input, native-select, number-field, skeleton, switch, tabs, textarea) — shadcn class sources. The never-rendered `react-aria-components` components were removed; only class exports and plain-element components remain (ADR 0002 decision 6: no RAC dependency).
  - `aw-kit/ui/cn` — `createCn` extended with the shared layer's text sizes, spacing aliases and shadows; the name lists are generated from `BASE` into `src/ui/internal/token-names.generated.ts` (`npm run gen:ui-names`, checked in `npm test`).
  - `aw-kit/ui/submit-enter` (IME-safe Enter／Esc, `useButtonKeys`), `aw-kit/ui/interactive`, `aw-kit/ui/menu-placement`, `aw-kit/ui/breakpoints` (media-query hooks; breakpoint values now come from `aw-kit/ui/theme` only), `aw-kit/ui/sanitize-number` (inknock `src/shared/number-input.ts`, renamed so the future `NumberInput` component can take `number-input`).
  - `vendor/shadcn-base/aria-nova-*` — upstream bases for three-way merges (not in `files`).
- Optional peer dependencies `class-variance-authority`, `cn`, `lucide-react`.
- `npm run lint:ui` (part of `npm test`, `--max-warnings 0`): every rule inknock applied to the moved files — js／typescript-eslint recommended (incl. `no-irregular-whitespace`), `react/jsx-no-comment-textnodes`, react-hooks, `aw-kit/eslint-rules` recommended, the restricted-syntax packs below, no bare `cn` import, `@supabase/*` type-only. Negative cases in `tests/ui/eslint-config.test.js`.
- `aw-kit/eslint-rules`: `imeKeyRules(message)`, `nativeDialogRules({ confirm, alert })`, `utcDateRules(message)`, `numberFieldRules({ inputMode, typeNumber })` — `no-restricted-syntax` selector packs moved from inknock so inknock and `aw-kit/ui` share one copy; callers supply the messages.
- `scripts/is-main.mjs` (moved from inknock, symlink／non-ASCII path tests) for aw-kit's own scripts.

## [0.5.0] — 2026-11-19

### Added

- `aw-kit/ui` groundwork (inknock ADR 0002, batch A): `tsconfig.ui.json` (strictest union of the two consumers — inflorify's strict flags, inknock's ES2020 lib), `tests/ui/` (React 19 `.tsx` pipeline test; export-map ↔ `src/ui` files consistency check with fixed negative cases; `src/ui/internal/` is never exported), `src/ui` added to `files`. No modules exported yet.
- `aw-kit/ui/theme` (batch B): the shared token layer (spacing／gap／pad, radius, shadow, motion, type scale, control and row heights, icons, interaction, breakpoints, layout, scrim, z-index, state colors) as TS constants, plus `createThemeFactory(brand)` and the `ThemeColors`／`BrandTokens`／`Theme` types. Moved verbatim from inknock `src/shared/theme.ts`.
- `aw-kit/design-tokens` (batch B): DESIGN.md token generator. `BASE` holds the shared layer; a project's DESIGN.md frontmatter holds only the brand layer (`colors` with exactly `BRAND_COLOR_NAMES`, `font-family`) and is rejected if it adds, omits or overrides a name. `mergeDesign`／`readDesign`／`render`／`renderNames`／`tokenNames`; `components` references are checked after merging. No YAML dependency: callers pass their parser (`readDesign(md, yaml.load)`).
- GitHub Actions CI (push to main／tags, PRs; read-only token; superseded runs cancelled): full test suite＋build on React 19, and everything except `tests/ui` re-run on React 18 (all four React packages verified to be 18).

### Changed

- Dev dependencies: React／React DOM and their types 18 → 19, pinned exactly to the lower of the two consumers (19.2.4／@types 19.2.14／19.2.3). notify／panel still support React ≥18 (verified by the new React 18 CI job).

## [0.4.1] — 2026-11-15

### Fixed

- `aw-kit/notify`: `ConfirmDialogHost` no longer dismisses on an Escape pressed during IME composition (Zhuyin/Cangjie candidate cancel). Uses the same `isCancelEscape` check as `aw-kit/panel` (`isComposing` or `keyCode === 229` — Safari sends keydown after compositionend). Reported by the inflorify review (P2); regression test in `tests/notify/ConfirmDialogHost.test.jsx`.
- `aw-check-rpc-types`: files are listed in sorted order, so diagnostics are stable across file systems.
- `aw-kit/eslint-rules` `meta.version` now tracks the package version (was stuck at 0.2.2).

## [0.4.0] — 2026-10-18

### Added

- `aw-kit/panel`: `PanelHeaderStatus` — optional third header row (status row) under the title, filled by a portal from any place in a content component's JSX; per-layer, renders inline outside `PanelHost`, takes no height while empty (`.aw-panel-status:empty`). `PanelHeader` gets an optional `statusRef` prop.
- `aw-kit/panel`: `StatusMenuBadge` (ported from inflorify) — clickable status badge with dropdown menu, keyboard support, IME-safe Esc that closes only the menu. New CSS variables `--aw-badge-*` (see `docs/panel.md` §4).
- Additive only; no existing behaviour changed.

## [0.3.1] — 2026-10-16

### Fixed

- `aw-kit/panel` review fixes: `--aw-panel-motion` now honours `s` as well as `ms` (`.22s` used to parse as 0.22 ms and unmount the exiting layer at once); header hit area is the `--aw-panel-hit` variable (default 44px); `matchMedia` lists are cached per query instead of created on every snapshot; `index.d.ts` no longer relies on the global `JSX` namespace (uses `ReactElement`); docs note that `--aw-panel-focus` can point at a project focus-ring variable.

## [0.2.2] — 2026-09-27

### Fixed

- **A `confirm()` opened right after another one settles no longer vanishes.** `settle()` cleared
  the dialog unconditionally 150ms later (after the close animation), so a two-step confirm
  (`await confirm(); await confirm()`) had its second dialog wiped mid-open: it flashed and
  disappeared, and its Promise never resolved. The deferred clear now only removes the dialog it
  belongs to. Found in inknock (delete-supplier double confirmation); regression test in
  `tests/notify/ConfirmDialogHost.test.jsx`.

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
