// 主題 context（2026-11-19，inknock ADR 0002 D2 批；自 inknock `lib/theme-context.tsx` 收進來）。
//
// aw-kit 沒有品牌值，所以**沒有預設主題**：`useTheme()` 找不到 `ThemeProvider` 就直接丟錯
// （inknock DECISIONS 2026-11-19，使用者選定）——寧可當場紅，也不要在沒注意時畫出別的品牌的顏色。
// 專案在自己的根節點包一層：`<ThemeProvider theme={createTheme()}>`（createTheme 由 `createThemeFactory(品牌層)` 產生）。
// 測試渲染用到主題的元件時同樣要包。
import { createContext, useContext, useEffect, type ReactNode } from 'react'
import type { Theme } from './theme'

const ThemeContext = createContext<Theme | null>(null)

export function ThemeProvider({ theme, children }: { theme: Theme; children: ReactNode }) {
  // 焦點環走 CSS 變數：全域 CSS 讀不到 TS 代幣，主色一換它就會停在舊色。
  // 而且焦點環只在鍵盤操作時出現，目視驗收看不到（inknock DESIGN.md → Components → Inputs）。
  // --focus-ring 掛在 document 上、是全站唯一一份，沒辦法照子樹分範圍：**只有最外層的 Provider 寫它**，
  // 巢狀的 Provider（品牌預覽、錯誤畫面自帶的那層）只提供 context、不碰焦點環。
  // （effect 是子層先跑，若每層都寫，外層會蓋掉內層、內層卸載又還原錯值——2026-11-19 測試抓到）
  const outer = useContext(ThemeContext)
  useEffect(() => {
    if (outer) return
    const root = document.documentElement.style
    root.setProperty('--focus-ring', theme.accent600)
    return () => { root.removeProperty('--focus-ring') }
  }, [outer, theme.accent600])

  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>
}

export function useTheme(): Theme {
  const theme = useContext(ThemeContext)
  if (!theme) throw new Error('aw-kit/ui：找不到 ThemeProvider——在根節點（測試則在 render 外層）包 <ThemeProvider theme={createTheme()}>')
  return theme
}
