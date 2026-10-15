import { useContext } from 'react'
import { PanelActionsContext, PanelStateContext } from './panel-context.js'

/** 對外：任何元件呼叫 openPanel／back／closeAll */
export function usePanel() {
  const ctx = useContext(PanelActionsContext)
  if (!ctx) throw new Error('usePanel 必須在 <PanelStackProvider> 內使用')
  return ctx
}

/** 內部：Host 讀堆疊狀態 */
export function usePanelStack() {
  const ctx = useContext(PanelStateContext)
  if (!ctx) throw new Error('usePanelStack 必須在 <PanelStackProvider> 內使用')
  return ctx
}
