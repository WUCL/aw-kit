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
//
// Imported as raw text (Vite's `?raw` suffix) rather than duplicated as a string, so this
// fallback can never drift out of sync with the authoritative rules in styles.css.
import CSS from './styles.css?raw'

const STYLE_ID = 'fbk-styles'

export function injectStyles() {
  if (typeof document === 'undefined') return
  if (document.getElementById(STYLE_ID)) return
  const el = document.createElement('style')
  el.id = STYLE_ID
  el.textContent = CSS
  document.head.appendChild(el)
}
