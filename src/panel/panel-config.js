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

// matchMedia 共用快取：每個 query 字串一個 MediaQueryList（模組層 Map），snapshot 讀快取的 mql.matches，
// 不再每次 render／snapshot 都 new 一個。測試替換 window.matchMedia 時快取會失效：記住上次的 matchMedia
// 函式參照，參照改變就清空（所以換掉 matchMedia 的測試永遠拿到新的）。
const mqlCache = new Map()
let cachedFor = null
function getMql(query) {
  if (cachedFor !== window.matchMedia) { mqlCache.clear(); cachedFor = window.matchMedia }
  let mql = mqlCache.get(query)
  if (!mql) { mql = window.matchMedia(query); mqlCache.set(query, mql) }
  return mql
}

function useMediaQuery(query) {
  const subscribe = useCallback((cb) => {
    const mql = getMql(query)
    mql.addEventListener('change', cb)
    return () => mql.removeEventListener('change', cb)
  }, [query])
  return useSyncExternalStore(subscribe, () => getMql(query).matches, () => false)
}

export function useIsMobile() {
  return useMediaQuery(usePanelConfig().mobileQuery)
}

export function useReducedMotion() {
  return useMediaQuery('(prefers-reduced-motion: reduce)')
}
