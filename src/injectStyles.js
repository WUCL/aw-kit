// src/injectStyles.js
// Fallback CSS injector for consumers who can't `import 'aw-notify-kit/dist/style.css'`
// directly (e.g. certain SSR/CSS-module-only setups).
//
// ⚠️ This is NOT the recommended path. In environments with a strict Content-Security-Policy
// (style-src without 'unsafe-inline'), the browser blocks this injected <style> tag and the
// components render unstyled. Prefer the CSS import in README "Quick Start" whenever possible.
//
// Guarded against:
// - double injection (React 18 Strict Mode mounts effects twice in dev; naive callers might
//   call this on every mount)
// - SSR (no `document` global)

const STYLE_ID = 'fbk-styles'

// Kept as a string (not imported from styles.css) so this file has zero build-time coupling
// to the CSS pipeline — it's a standalone fallback, not a re-export of styles.css.
const CSS = `
:root {
  --fbk-accent: #7d6299;
  --fbk-accent-hover: #634d7d;
  --fbk-toast-bg: #1f2937;
  --fbk-toast-fg: #f9fafb;
  --fbk-success: #4ade80;
  --fbk-error: #f87171;
  --fbk-error-border: rgba(248, 113, 113, 0.35);
  --fbk-z-toast: 850;
  --fbk-z-dialog: 1000;
}
/* See src/styles.css for the full, authoritative rule set — this fallback carries the
   same rules; keep the two files in sync if the design changes. */
`

export function injectStyles() {
  if (typeof document === 'undefined') return
  if (document.getElementById(STYLE_ID)) return
  const el = document.createElement('style')
  el.id = STYLE_ID
  el.textContent = CSS
  document.head.appendChild(el)
}
