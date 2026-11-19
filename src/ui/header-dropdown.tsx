// 2026-11-19 自 inknock `src/shared/ui/header-dropdown.tsx` 原樣搬入（inknock ADR 0002 D3 批）；註解中的 DESIGN.md／DECISIONS／批次指 inknock 的紀錄。
import { useEffect, useLayoutEffect, useRef, useState, type ReactNode, type RefObject } from "react"
import { createPortal } from "react-dom"
import { useIsMobile } from "./breakpoints"
import { useTheme } from './theme-context'
import { Z } from './theme'
import { isCancelEscape } from './submit-enter'
import { cn } from './cn'
import { menuContentClassName } from './primitives/dropdown-menu'

/**
 * 標題列右側的下拉浮框（通知／搜尋結果／品牌選單共用）。
 *
 * - 桌機／iPad：掛在觸發鈕容器（`anchorRef`，須為 position:relative）下方，
 *   `top:40; right:0; width` 與原本三個浮框完全相同。
 * - 手機：浮框 portal 到 body、`position:fixed` 從標題列底緣滿版展開（左右貼齊、無圓角），
 *   下方加淡遮罩；點遮罩收起，內容超出時框內捲動（最高 70vh）。
 *   固定寬浮框在 375 寬會超出左緣被切掉，是此元件存在的理由。
 * - 外觀（2026-11-18 第 28 批）：桌機容器用選單 class（`primitives/dropdown-menu.tsx`，淡環＋陰影、內距 4、圓角 lg），
 *   裡面的列請用 `menu-row.tsx`；手機 sheet 容器不變（滿版、無圓角、遮罩），只是內容同樣包一層內距 4，讓列與桌機一致。
 *   ⚠️ 只換外觀、不換語意：這不是 menu（沒有 role=menu、方向鍵），搜尋框的焦點也留在輸入框。
 * - 兩種寬度都：Esc（排除輸入法組字）、點外側（含手機點標題列其他控制項）與路由變更收起。
 * - 手機浮框是 dialog：aria-modal、開啟時焦點進浮框、關閉回原焦點（面板殼 `panel/layer-utils.ts` 的 dialogAbove 靠 aria-modal 偵測）。
 *
 * 標題列底緣不寫死高度：從 `anchorRef` 往上找 `<header>` 量 `getBoundingClientRect().bottom`，
 * 找不到才退回觸發鈕容器自身的底緣。portal 到 body 是因為標題列祖先若有 transform，
 * fixed 會被困住（同 side-panel.tsx 的 portal 註解）。
 */
export function HeaderDropdown({
  open, onClose, anchorRef, width, label, moveFocus = true, routeKey, children,
}: {
  open: boolean
  onClose: () => void
  /** 觸發鈕容器（桌機浮框的定位基準；「點外側」也以它為內側） */
  anchorRef: RefObject<HTMLElement | null>
  /** 桌機／iPad 寬度（px） */
  width: number
  /** 無障礙名稱（手機 dialog 的 aria-label） */
  label: string
  /**
   * 目前路由的識別（例：pathname + search）；開著時值變了就收起（換頁不殘留浮框）。
   * **必填**：aw-kit 不依賴路由套件，由消費端帶入；真的不需要隨換頁收起時明寫 `null`（漏給在編譯期就擋下）
   */
  routeKey: string | null
  /** 手機開啟時是否把焦點移進浮框（預設 true；搜尋框要留在輸入框內繼續打字，傳 false） */
  moveFocus?: boolean
  children: ReactNode
}) {
  const T = useTheme()
  const isMobile = useIsMobile()
  const onCloseRef = useRef(onClose)
  useEffect(() => { onCloseRef.current = onClose })
  const [top, setTop] = useState(0)
  const sheetRef = useRef<HTMLDivElement>(null)
  // 換頁（路由變更）→ 收起，避免浮框殘留在新頁面上。路由由消費端給（routeKey，例：pathname + search）——
  // aw-kit 不依賴路由套件（2026-11-19 D3 review）；inknock 由 src/shared/ui/header-dropdown.tsx 帶入
  const routeRef = useRef(routeKey)
  useEffect(() => {
    if (routeRef.current === routeKey) return
    routeRef.current = routeKey
    if (open) onCloseRef.current()
  }, [routeKey, open])

  // 手機：開啟時焦點移進浮框，關閉時回觸發鈕（觸發鈕＝開啟前的焦點元素）
  useEffect(() => {
    if (!open || !isMobile || !moveFocus) return
    const a = document.activeElement as HTMLElement | null
    // Safari 點按鈕不會讓按鈕取得焦點（activeElement 會是 body）→ 退回 anchor 內第一個可聚焦元素
    const prev = a && a !== document.body ? a : anchorRef.current?.querySelector<HTMLElement>('button,input,a[href]') ?? null
    sheetRef.current?.focus()
    return () => { prev?.focus?.() }
  }, [open, isMobile, moveFocus, anchorRef])

  // 手機：量標題列底緣（開啟當下與視窗尺寸變動時）
  useLayoutEffect(() => {
    if (!open || !isMobile) return
    const measure = () => {
      const a = anchorRef.current
      const hdr = a?.closest('header')
      setTop((hdr ?? a)?.getBoundingClientRect().bottom ?? 0)
    }
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [open, isMobile, anchorRef])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (isCancelEscape(e)) onCloseRef.current() }
    // 點外側 → 收起。手機浮框 portal 到 body，不在 anchor 內，故另判 sheetRef；
    // 遮罩只蓋標題列以下，標題列其他控制項（品牌鈕、新增、漢堡）靠這條收。
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node
      if (anchorRef.current?.contains(t) || sheetRef.current?.contains(t)) return
      if (anchorRef.current) onCloseRef.current()
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('mousedown', onDown)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('mousedown', onDown)
    }
  }, [open, isMobile, anchorRef])

  if (!open) return null

  if (!isMobile) {
    return (
      <div
        // overflow-x-hidden：選單 class 只有 overflow-y-auto（會讓 x 也變 auto），內容過寬（長網址、長姓名）時照舊裁掉、不出橫向捲軸
        className={cn(menuContentClassName, 'origin-top-right overflow-x-hidden')}
        style={{ position: 'absolute', top: 40, right: 0, width, zIndex: Z.menu }}
      >
        {children}
      </div>
    )
  }

  return createPortal(
    <>
      <div
        data-testid="header-dropdown-mask"
        onClick={onClose}
        style={{ position: 'fixed', top, left: 0, right: 0, bottom: 0, background: T.scrim, zIndex: Z.menu - 1 }}
      />
      <div
        data-testid="header-dropdown-sheet"
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        aria-label={label}
        tabIndex={-1}
        style={{ outline: 'none',
          position: 'fixed', top, left: 0, right: 0, maxHeight: '70vh', overflowY: 'auto',
          background: '#fff', borderBottom: `1px solid ${T.lineStrong}`,
          boxShadow: T.shadow.menu, zIndex: Z.menu,
        }}
      >
        <div className="p-1">{children}</div>
      </div>
    </>,
    document.body,
  )
}
