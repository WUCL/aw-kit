// Fallback CSS injector for consumers who can't `import 'aw-kit/panel/style.css'` directly.
// Same caveats as aw-kit/notify's injectStyles: blocked by a strict CSP (style-src without 'unsafe-inline');
// prefer the CSS import. Guarded against double injection and SSR.
import CSS from './styles.css?raw'

const STYLE_ID = 'awp-styles'

export function injectStyles() {
  if (typeof document === 'undefined') return
  if (document.getElementById(STYLE_ID)) return
  const el = document.createElement('style')
  el.id = STYLE_ID
  el.textContent = CSS
  document.head.appendChild(el)
}
