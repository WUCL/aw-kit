// 2026-11-19 自 inknock `src/shared/breakpoints.ts` 原樣搬入（inknock ADR 0002 C 批）；註解中的 DECISIONS／CLAUDE.md／日期指 inknock 的紀錄。
import { useCallback, useState, useEffect, useSyncExternalStore } from 'react'

// 斷點值只有一份：共用層 theme.ts 的 BREAKPOINTS（原本這裡另寫一份同值的，搬進 aw-kit 時合併）
import { BREAKPOINTS } from './theme'

/** 手機斷點的 media query（useIsMobile 與面板殼共用，不要手抄） */
export const MOBILE_QUERY = `(max-width: ${BREAKPOINTS.mobile - 1}px)`

// 同一條 query 全站共用一個 MediaQueryList 與一個 change listener，再分發給訂閱的元件。
// 原本每個元件各自 addEventListener：大表格上每格的 Button／Input 都掛一個（2026-10-01 收斂）。
// 以 window.matchMedia 本身為 cache 的鍵之一：測試換掉 matchMedia 時不會拿到舊的 MediaQueryList。
type Shared = { mql: MediaQueryList; subs: Set<() => void>; onChange: () => void }
const shared = new Map<string, Shared>()
let sharedFor: typeof window.matchMedia | undefined

function getShared(query: string): Shared {
  if (sharedFor !== window.matchMedia) { shared.clear(); sharedFor = window.matchMedia }
  let s = shared.get(query)
  if (!s) {
    const subs = new Set<() => void>()
    s = { mql: window.matchMedia(query), subs, onChange: () => subs.forEach((fn) => fn()) }
    shared.set(query, s)
  }
  return s
}

export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback((cb: () => void) => {
    const s = getShared(query)
    if (s.subs.size === 0) s.mql.addEventListener('change', s.onChange)
    s.subs.add(cb)
    return () => {
      s.subs.delete(cb)
      if (s.subs.size === 0) s.mql.removeEventListener('change', s.onChange)
    }
  }, [query])
  // 首次 render 即拿到正確值（同步讀 matches），避免 mobile 端先閃一幀桌機版
  return useSyncExternalStore(subscribe, () => getShared(query).mql.matches, () => false)
}

export function useIsMobile() {
  return useMediaQuery(MOBILE_QUERY)
}

export function useIsTablet() {
  return useMediaQuery(`(max-width: ${BREAKPOINTS.tablet - 1}px)`)
}

/**
 * 系統是否開啟「減少動態效果」（iOS 設定 → 輔助使用 → 動作）。
 *
 * 純視覺的 transition 已由 `src/index.css` 的全域 media query 一次蓋掉，
 * **不需要**每個元件都接這個 hook。只有「JS 時序需要跟著縮短」的元件才用——
 * 例如 SidePanel 以 timer 等退場動畫跑完才卸載內容：CSS 只蓋視覺，
 * timer 仍會照原時長等待，導致面板已消失但 DOM 還停在畫面上。
 */
export function useReducedMotion() {
  return useMediaQuery('(prefers-reduced-motion: reduce)')
}

export function useResponsive() {
  const isMobile = useIsMobile()
  const isTablet = useIsTablet()
  const [width, setWidth] = useState<number>(() =>
    typeof window === 'undefined' ? 1280 : window.innerWidth,
  )
  useEffect(() => {
    const onResize = () => setWidth(window.innerWidth)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])
  return { isMobile, isTablet, width }
}
