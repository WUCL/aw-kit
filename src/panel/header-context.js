import { createContext, useContext, useEffect } from 'react'
import { createPortal } from 'react-dom'

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

// 狀態列槽位（v0.4.0）：HostLayer 把「所屬層標頭的狀態列 DOM 節點」放進這個 context。
// undefined＝不在 PanelHost 內（PanelHeaderStatus inline render）；null＝在殼內但容器尚未掛上（本輪不畫，掛上後重繪）。
export const PanelHeaderSlotContext = createContext(undefined)

/**
 * 在標頭標題列下方的「狀態列」畫任意元素（可點的狀態章、交貨日文字…）。內容元件在自己的 JSX 任意位置寫即可，
 * 以 portal 畫進所屬層標頭。不走 usePanelHeader 的 effect 登記：ReactNode 每次渲染都是新參照，會無限重登記。
 * 在 PanelHost 之外使用時直接 inline render（方便單元測試內容元件）。
 */
export function PanelHeaderStatus({ children }) {
  const slot = useContext(PanelHeaderSlotContext)
  if (slot === undefined) return children ?? null
  if (slot === null) return null
  return createPortal(children, slot)
}
