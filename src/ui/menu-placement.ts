// 2026-11-19 自 inknock `src/shared/ui/menu-placement.ts` 原樣搬入（inknock ADR 0002 C 批）；註解中的 DECISIONS／CLAUDE.md／日期指 inknock 的紀錄。
// 浮層（下拉選單、搜尋選單）的定位計算，`use-dropdown-menu.ts` 與 `combobox.tsx` 共用（2026-11-16 抽出）。
// 純函式：給錨點（觸發鈕／輸入框）的位置、浮層實際高度、可見範圍，回傳 fixed 定位。
//
// - 下方放得下 → 往下開；放不下且上方放得下 → 往上開；上下都不夠 → 貼齊可見範圍上緣，由浮層自己捲動。
// - `keepAnchorVisible`（搜尋選單）：上下都不夠時改成「挑空間大的那一邊、高度縮到那一邊」，不蓋住錨點——
//   下拉選單蓋住觸發鈕無妨，搜尋選單蓋住輸入框就看不到自己打的字（2026-11-16 真瀏覽器 360 高的視窗實測；iPad 叫出鍵盤後差不多就這麼矮）。
// - 可見範圍由呼叫端給：下拉選單用 innerHeight（觸發鈕是按鈕，不會叫出鍵盤）；
//   搜尋選單用 visualViewport（iPad 叫出鍵盤後可見範圍變矮，用 innerHeight 會把清單開在鍵盤後面）。

export const MENU_GAP = 6
export const MENU_EDGE = 8

export type MenuPlacement = { top: number; x: number; width: number; up: boolean; maxH: number }

export function placeMenu({ anchor, height, viewport, align, minWidth = 0, menuWidth = 0, keepAnchorVisible = false }: {
  /** 錨點的 getBoundingClientRect（以 layout viewport 為座標） */
  anchor: { top: number; bottom: number; left: number; right: number; width: number }
  /** 浮層內容高度（已掛載用 scrollHeight 實測；未掛載用估計值） */
  height: number
  /** 可見範圍：上緣、下緣（layout viewport 座標）與寬度 */
  viewport: { top: number; bottom: number; width: number }
  align: 'start' | 'end'
  minWidth?: number
  /** 浮層目前的實際寬度（已掛載時），靠左對齊時避免超出右緣 */
  menuWidth?: number
  /** 上下都放不下時不蓋住錨點（見檔頭） */
  keepAnchorVisible?: boolean
}): MenuPlacement {
  const width = Math.max(anchor.width, minWidth)
  const spaceBelow = viewport.bottom - anchor.bottom - MENU_GAP - MENU_EDGE
  const spaceAbove = anchor.top - MENU_GAP - (viewport.top + MENU_EDGE)
  const x = align === 'end'
    ? Math.max(MENU_EDGE, viewport.width - anchor.right)
    : Math.max(MENU_EDGE, Math.min(anchor.left, viewport.width - Math.max(width, menuWidth) - MENU_EDGE))
  if (keepAnchorVisible && height > spaceBelow && height > spaceAbove) {
    if (spaceBelow >= spaceAbove) return { top: anchor.bottom + MENU_GAP, x, width, up: false, maxH: Math.max(0, spaceBelow) }
    return { top: viewport.top + MENU_EDGE, x, width, up: true, maxH: Math.max(0, spaceAbove) }
  }
  const up = height > spaceBelow && height <= spaceAbove
  const top = height <= spaceBelow ? anchor.bottom + MENU_GAP : up ? anchor.top - MENU_GAP - height : viewport.top + MENU_EDGE
  return { top, x, width, up, maxH: viewport.bottom - top - MENU_EDGE }
}

/** 下拉選單用：整個視窗（iPad Safari 的 100vh 比可見區高，所以用 innerHeight；clientWidth 不含捲軸） */
export function windowViewport() {
  return { top: 0, bottom: window.innerHeight, width: document.documentElement.clientWidth }
}

/** 搜尋選單用：扣掉螢幕鍵盤後真正看得到的範圍（不支援 visualViewport 時退回整個視窗） */
export function visibleViewport() {
  const vv = window.visualViewport
  if (!vv) return windowViewport()
  return { top: vv.offsetTop, bottom: vv.offsetTop + vv.height, width: document.documentElement.clientWidth }
}
