import { createContext, useContext, useEffect } from 'react'

// 內容元件把自己的標題（與可選 meta）登記到所屬 entry；PanelHost 讀 top 渲染 PanelHeader，
// 並讀前一層 entry 的標題當「‹ 來源名」。與 close-guard 同模式（context 登記、卸載即清）。
export const PanelHeaderContext = createContext(null)

/**
 * 登記目前面板的標題／meta。單一 hook 而非 usePanelTitle＋usePanelMeta：標題與單號同屬頭部、
 * 常一起算出（「訂單」＋單號），一次登記避免兩次渲染的中間態閃動。meta 限字串（ReactNode 每次渲染
 * 都是新參照，會讓 effect 無限重登記）；title 在 entry 上保留，卸載後前一層仍讀得到。
 */
export function usePanelHeader({ title, meta }) {
  const reg = useContext(PanelHeaderContext)
  useEffect(() => { reg?.set({ title, meta }) }, [reg, title, meta])
}
