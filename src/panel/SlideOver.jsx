import { useState, useEffect, useLayoutEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { isCancelEscape } from './key-utils.js'
import { usePanelConfig, useIsMobile, useReducedMotion } from './panel-config.js'
import { MOBILE_PANEL_WIDTH, dialogAbove } from './layer-utils.js'

// 單層右側滑入抽屜（2026-10-15 翻案 ⑧：PanelHost 每層一個，全部保留掛載）。
// 本元件是「受控」的：open 決定滑入／滑出，卸載時機由 PanelHost 的 ghost 機制決定（open=false 後等動畫跑完才移除）。
// 只有 isTop 的那層回應 Esc／Tab focus trap／帶 aria-modal；其餘層 inert＋aria-hidden（不可聚焦、讀屏略過）。
// 遮罩與面板 z-index 成對遞增（overlayZ(index, zBase)）：上層遮罩必蓋過下層面板，點下層露出的縫隙＝點上層遮罩＝只關最上層。
// body 捲動鎖不在這裡（多層會互相覆蓋還原值），由 PanelHost 只鎖一次。
const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled])'

/**
 * 滑出動畫時長（ms），讀 CSS 變數 --aw-panel-motion（取代 inknock 的 parseInt(MOTION.panel)）。
 * PanelHost 用它決定 ghost 層何時卸載，所以要和實際 transition 同一個來源；讀不到（SSR／未載入樣式）退 220。
 */
export function getPanelExitMs() {
  if (typeof document === 'undefined') return 220
  const raw = getComputedStyle(document.documentElement).getPropertyValue('--aw-panel-motion').trim()
  const m = /^(\d*\.?\d+)(ms|s)$/i.exec(raw)   // 只認帶單位的 ms／s；'.22s'、'0.2s'、'220ms' 皆可
  if (!m) return 220
  const ms = m[2].toLowerCase() === 's' ? parseFloat(m[1]) * 1000 : parseFloat(m[1])
  return Number.isFinite(ms) ? ms : 220
}
export const DEFAULT_WIDTH = 'min(560px, calc((100vw - var(--app-shell-sidebar-width, 0px)) * 0.52))'

/** 第 index 層（0 起算）的遮罩 z；面板本體 +1。MAX_DEPTH=8 → 最高 zBase+15（zBase 預設 160，inknock 的 Z.panelHost）。 */
export const overlayZ = (index, zBase = 160) => zBase + index * 2
/**
 * 桌機寬：第一層完整寬度，第二層起**固定**縮 7%（不逐層加深；2026-10-15 使用者實機後定）。
 * 只要有疊層左側就露出一截（點了關最上層），內容寬度又不會越疊越窄。7% 而非 5%：
 * iPad 上 5% 只露出約 20px，看不出底下有一層（2026-09-11 已測、2026-10-15 再試確認）。手機同規則見下方 width。
 */
export const desktopWidth = (base, index) => {
  const b = typeof base === 'number' ? `${base}px` : base
  // 2026-10-15 使用者定：第二層起固定縮 7%（不逐層加深）
  return index === 0 ? b : `max(360px, calc(${b} * 0.93))`
}

export function SlideOver({ open, index, isTop, ariaLabel, children, onRequestClose, width = DEFAULT_WIDTH }) {
  const [shown, setShown] = useState(false)
  const panelRef = useRef(null)
  const wrapRef = useRef(null)
  const restoreFocusRef = useRef(null)
  const isTopRef = useRef(isTop)
  useEffect(() => { isTopRef.current = isTop })
  const mobile = useIsMobile()
  const reduceMotion = useReducedMotion()
  const z = overlayZ(index, usePanelConfig().zBase)

  // inert 以 DOM 屬性設定：React 18 不認布林 inert（會警告且不輸出），React 19 才認；兩版都要能跑
  useLayoutEffect(() => {
    const el = wrapRef.current
    if (!el) return
    if (isTop) el.removeAttribute('inert'); else el.setAttribute('inert', '')
  }, [isTop])

  // 掛載：下一幀滑入；記住開啟前的焦點，卸載時還原（關上層＝回到下層原焦點元素）；新層把焦點移進來
  useEffect(() => {
    restoreFocusRef.current = document.activeElement
    const raf = requestAnimationFrame(() => setShown(true))
    const focusTimer = setTimeout(() => { if (isTopRef.current) panelRef.current?.querySelector(FOCUSABLE)?.focus({ preventScroll: true }) }, 60)
    return () => {
      cancelAnimationFrame(raf); clearTimeout(focusTimer)
      if (restoreFocusRef.current instanceof HTMLElement && restoreFocusRef.current.isConnected) restoreFocusRef.current.focus({ preventScroll: true })
    }
  }, [])

  // Esc 關閉＋Tab focus trap：只有最上層註冊
  const closeRef = useRef(onRequestClose)
  useEffect(() => { closeRef.current = onRequestClose })
  useEffect(() => {
    if (!isTop || !open) return
    const onKey = (e) => {
      if (e.defaultPrevented) return   // 內層元件（例：下拉選單）已處理這次按鍵
      if (isCancelEscape(e)) {
        // 上面疊著 Modal／確認框時讓出：Esc 只該關最上層那一個。以「本層實際面板 z」比較，只看高於本層者
        if (dialogAbove(z + 1)) return
        closeRef.current()
        return
      }
      if (e.key !== 'Tab') return
      const f = panelRef.current?.querySelectorAll(FOCUSABLE)
      if (!f || f.length === 0) return
      const first = f[0], last = f[f.length - 1]
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus() }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus() }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [isTop, open, z])

  const visible = open && shown
  const transition = reduceMotion ? 'none' : undefined
  // 必須 portal 到 body：避免被祖先 transform 變成 position:fixed 的包含塊（見 side-panel.tsx 2026-09-10 診斷）
  return createPortal(
    <div ref={wrapRef} aria-hidden={isTop ? undefined : true} style={{ position: 'fixed', inset: 0, zIndex: z, pointerEvents: open ? undefined : 'none' }}>
      <div onClick={() => { if (isTop) onRequestClose() }} aria-hidden="true"
        style={{ position: 'absolute', inset: 0, background: 'var(--aw-panel-scrim)', opacity: visible ? 1 : 0, transition: transition ?? 'opacity var(--aw-panel-motion) ease-out' }} />
      <div ref={panelRef} role="dialog" aria-modal={isTop ? 'true' : undefined} aria-label={ariaLabel}
        style={{
          position: 'absolute', top: 0, bottom: 'var(--aw-panel-offset-bottom)', right: 0, display: 'flex', flexDirection: 'column', overflowY: 'auto',
          zIndex: z + 1,
          width: mobile ? (index === 0 ? MOBILE_PANEL_WIDTH : `calc(${MOBILE_PANEL_WIDTH} * 0.93)`) : desktopWidth(width, index),  // 手機同規則、不設 360 下限（會比螢幕寬）
          maxWidth: '100%', background: 'var(--aw-panel-bg)', boxShadow: 'var(--aw-panel-shadow)', borderRadius: 'var(--aw-panel-radius)',
          transform: visible ? 'translateX(0)' : 'translateX(100%)',
          transition: transition ?? 'transform var(--aw-panel-motion) var(--aw-panel-easing)',
        }}>
        {children}
      </div>
    </div>,
    document.body,
  )
}
