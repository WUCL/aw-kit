import { createContext, useContext, useCallback, useSyncExternalStore } from 'react'

// Provider-level injected configuration (aw-kit/panel replaces inknock's hard imports with these):
//   router     { useLocation, useNavigate, useNavigationType }  router adapter (hooks)
//   zBase      z-index of layer 0's scrim (inknock Z.panelHost = 160)
//   mobileQuery media query that switches to the mobile layout (inknock breakpoints.mobile = 768 -> max-width 767px)
//   onMaxDepth called instead of inknock's toast.error when MAX_DEPTH is reached
export const DEFAULT_Z_BASE = 160
export const DEFAULT_MOBILE_QUERY = '(max-width: 767px)'

export const PanelConfigContext = createContext({
  router: null,
  zBase: DEFAULT_Z_BASE,
  mobileQuery: DEFAULT_MOBILE_QUERY,
  onMaxDepth: undefined,
})

export function usePanelConfig() {
  return useContext(PanelConfigContext)
}

// Own matchMedia subscription (no shared cache): reads window.matchMedia on every snapshot so a
// replaced matchMedia (tests) is never stale. Same first-render-correct behaviour as inknock's useMediaQuery.
function useMediaQuery(query) {
  const subscribe = useCallback((cb) => {
    const mql = window.matchMedia(query)
    mql.addEventListener('change', cb)
    return () => mql.removeEventListener('change', cb)
  }, [query])
  return useSyncExternalStore(subscribe, () => window.matchMedia(query).matches, () => false)
}

export function useIsMobile() {
  return useMediaQuery(usePanelConfig().mobileQuery)
}

export function useReducedMotion() {
  return useMediaQuery('(prefers-reduced-motion: reduce)')
}
