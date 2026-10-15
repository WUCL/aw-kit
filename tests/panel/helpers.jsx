import { useLocation, useNavigate, useNavigationType } from 'react-router-dom'

// react-router-dom (v6) is a devDependency of aw-kit used only by tests: it is plugged in through the same
// adapter a consuming project passes to <PanelStackProvider router={...}>.
export const routerAdapter = { useLocation, useNavigate, useNavigationType }

// jsdom has no matchMedia. `mobile` true = every query matches (phone width);
// `reduced` (optional) overrides only prefers-reduced-motion queries. Copied from inknock tests/helpers/match-media.ts.
export function installMatchMedia(mobile = false, reduced) {
  window.matchMedia = (query) => ({
    matches: reduced !== undefined && query.includes('prefers-reduced-motion') ? reduced : mobile, media: query, onchange: null,
    addEventListener: () => {}, removeEventListener: () => {},
    addListener: () => {}, removeListener: () => {}, dispatchEvent: () => false,
  })
}
