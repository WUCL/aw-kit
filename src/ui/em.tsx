// 2026-11-19 自 inknock `src/shared/ui/em.tsx` 原樣搬入（inknock ADR 0002 D2 批）；註解中的 DESIGN.md／DECISIONS／批次指 inknock 的紀錄。
import type { ReactNode } from 'react'
import { useTheme } from './theme-context'

// 行內強調（2026-09-08）。
//
// ⚠️ **為什麼不直接用 `<b>`：** `<b>` 與 `<strong>` 走瀏覽器預設的 `font-weight: bold`＝**700**，
//    而 `DESIGN.md` 與 `theme.ts` 都明訂 **中文字重上限 600**（`semibold: 600 // 中文的上限`）。
//    PingFang TC 沒有 700 這一級，瀏覽器會**合成假粗體**（把字形硬撐開），
//    在 iPad 這個主載具上看起來髒、且與隔壁同級文字對不齊。
//
// ⚠️ **數字不要用這個元件。** 同一份代幣寫得很清楚：`bold: 700 // 數字／拉丁（金額、KPI）`。
//    金額、件數、KPI 用 `<b>` 是對的——拉丁與數字字形有真正的 700。
//    判準是「**被包起來的內容是不是中文**」，不是「這句話重不重要」。
//
//    ✅ `本次將入庫 <b>{qty}</b> 件`          ← 數字，700，維持 <b>
//    ✅ `結案後會<Em>退回「待叫貨」</Em>`      ← 中文，600，用 Em
//
// 2026-09-08 由 Codex 多視角 review（三綠沈默的畫面缺陷）指出；
// 全站尚有其餘 `<b>`／`<strong>` 待逐一分類，見 TODO。
export function Em({ children }: { children: ReactNode }) {
  const T = useTheme()
  return <span style={{ fontWeight: T.fontWeight.semibold }}>{children}</span>
}
