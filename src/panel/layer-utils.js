// 自舊 side-panel.tsx 搬來（2026-10-15 刪除舊 SidePanel 時）：新殼仍需要的兩個小工具。

/** 手機第一層面板寬：左側留 40px 縫隙（點了＝關最上層），第二層起再 ×0.93（見 SlideOver） */
export const MOBILE_PANEL_WIDTH = 'calc(100% - 40px)'

// 元素實際所在的疊層：往上找第一個有數字 z-index 的祖先（含自己）
function effectiveZ(el) {
  for (let n = el; n && n !== document.body; n = n.parentElement) {
    const z = parseInt(getComputedStyle(n).zIndex, 10)
    if (!Number.isNaN(z)) return z
  }
  return 0
}

/** 是否有 aria-modal 對話框疊在 z 之上（Modal 會帶 aria-modal；aw-kit 確認框亦同）。疊在下面的（如 readingOverlay）不算。 */
export function dialogAbove(z) {
  return [...document.querySelectorAll('[aria-modal="true"]')].some(el => effectiveZ(el) > z)
}
