/** 面板殼推的歷史紀錄用 state.awPanel 標深度。 */
export const awPanelOf = (loc) => {
  const v = loc.state?.awPanel
  return typeof v === 'number' ? v : 0
}

/**
 * 「面板自身的移動」：同 pathname＋search，只有 state.awPanel 不同（開／關一層面板推或退的紀錄）。
 * 所有 useBlocker 的 shouldBlock 都要排除它，否則頁面有未存變更時開／關面板會誤跳「離開前確認」，
 * 且殼的 navigate(-n) 會被攔下。
 */
export function isPanelOnlyNavigation(current, next) {
  if (allowDepth > 0) return true
  return current.pathname === next.pathname && current.search === next.search && awPanelOf(current) !== awPanelOf(next)
}

// module-state-ok: 同步包住「殼關閉網址層後呼叫頁面 onClosed（清 param 的 replace）」的計數；navigate 的攔截判斷是同步的，
// 包住期間發出的導航是面板自身的移動（使用者已在殼的守門確認過），不該再被頁面層級的 useBlocker 攔第二次。
let allowDepth = 0
export function withPanelNavigationAllowed(fn) {
  allowDepth++
  try { return fn() } finally { allowDepth-- }
}
