import { createContext } from 'react'

// 分 state／actions 兩個 context：只用 actions 的呼叫端不被 stack 變動連累重繪。
export const PanelStateContext = createContext(null)
export const PanelActionsContext = createContext(null)
