import { createContext, useContext, useEffect, useRef } from 'react'

// 面板關閉守門（Codex 4-B P1-1）：內容元件登記一個 guard，PanelHost 的所有關閉路徑——Esc、點遮罩、
// 內容呼叫的 closeAll／back——都先問它。guard 回 false（例如送出中、或使用者在「放棄未存檔？」選取消）就不關。
// 換頁（PUSH）時 PanelStackProvider 的 closeAll 不經這裡：路由離開由頁面的 useBlocker 攔（以 isPanelOnlyNavigation 排除面板自身移動）。
// 同一層可有多支守門（例：StaffPanel 基本資料＋其子分頁 DesignerScheduleTab）：add 回傳各自的解除函式，只移除自己那支。

/** 依登記順序逐支詢問，第一支回 false 即停（不再問後面的，同一次關閉不連跳多個框）。 */
export async function runCloseGuards(guards) {
  for (const g of [...guards]) if (!(await g())) return false
  return true
}

export const PanelCloseGuardContext = createContext(null)

/** 登記目前面板的關閉守門；傳 null＝不守門。guard 以 ref 保存最新版本，不需 memo。 */
export function usePanelCloseGuard(guard) {
  const reg = useContext(PanelCloseGuardContext)
  const latest = useRef(guard)
  useEffect(() => { latest.current = guard })
  const has = guard !== null
  useEffect(() => {
    if (!reg || !has) return
    return reg.add(() => (latest.current ? latest.current() : true))
  }, [reg, has])
}
