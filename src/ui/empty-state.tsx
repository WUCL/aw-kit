// 2026-11-19 自 inknock `src/shared/ui/empty-state.tsx` 原樣搬入（inknock ADR 0002 D1 批）；註解中的 DESIGN.md／DECISIONS／批次指 inknock 的紀錄。
import type { CSSProperties, ReactNode } from 'react'
import { emptyVariants } from './primitives/empty'

/**
 * 載入中／空清單／錯誤／未啟用 —— 頁面與面板的「沒有內容可看」狀態。
 *
 * 🔴 為什麼要有這支（2026-08-28，批次 7c-1）：
 *    盤點發現 `padding: 40` 出現 **47 次**，另有 `'60px 0'`／`'60px 24px'`／`'40px 0'`
 *    共 29 次——**實查確認全部是同一段版面**：置中區塊 ＋ body 字級 ＋ 次要色。
 *    47 個地方各寫一次，等於同一個決定做了 47 遍。
 *    計畫書 §2.3 早就寫過結論：「靠元件化解決，不靠間距規則」——
 *    在那 47 處逐一把 40 換成 `spacing['4xl']` 只是換寫法，重複本身沒有消失。
 *
 * ⚠️ **`align` 預設 center，但遷移時逐處保留原本的對齊**。
 *    原本 47 處裡有 28 處沒有 `textAlign: 'center'`；一律置中會是 28 處的視覺變更，
 *    而這一批的承諾是「值不變、純收斂」。預設 center 只影響**日後新寫的**程式碼。
 *
 * 🔴 **`tone="error"` 用 `state.danger.text` 而不是 `danger.base`**。
 *    盤點時實測：`danger.base` #EF4444 在白底對比 **3.76**、在 canvas 上 **3.51**，
 *    **兩者都低於 AA 的 4.5**——而它被當成錯誤訊息的文字色用了 9 處。
 *    `danger.text` #7F1D1D 是 10.02。`base` 是給「元件填色」用的，不是給文字用的。
 *    這支元件把那 9 處一併修正。
 */
export type EmptyStateTone = 'muted' | 'faint' | 'error'

/**
 * 空狀態的留白。**刻意在這裡寫死數值，不做代幣算術。**
 *
 * ⚠️ 60 不在間距代幣上，而 `spacing['5xl'] + spacing.md` 這種寫法是
 *    「代幣做算術」——grep 看起來合規、稽核還會算成有用代幣，是最難發現的偏離
 *    （2026-08-28 在 `badge.tsx` 才剛清掉一個 `T.gap.hairline + 1`）。
 *    這支元件現在**就是**「空狀態留白」的唯一決定點，直接寫 px 值（`p-[40px]` 等）比假裝合規誠實。
 *    要調整縱向留白，改 primitives/empty.tsx 的 `padded` 四行即可（2026-11-15 改走 class）——不會再散到 76 個地方：
 *    block 四面 40（頁面層級的載入／錯誤）／tight 上下 40（左右由容器負責）／inset 上下 60（卡片／面板內部的空清單）／insetX 60×24（同上，且自己撐左右）
 */
type Pad = 'block' | 'tight' | 'inset' | 'insetX'

export function EmptyState({
  tone = 'faint',
  align = 'center',
  padded = 'block',
  style,
  children,
}: {
  /** `muted` 次要文字／`faint` 三級文字（空狀態預設）／`error` 錯誤訊息 */
  tone?: EmptyStateTone
  align?: 'center' | 'left'
  padded?: Pad
  style?: CSSProperties
  children: ReactNode
}) {
  // 外觀走 primitives/empty.tsx 的 class（2026-11-15 改走 class，外觀不變）；呼叫端 style 仍可覆寫（排版）
  return (
    <div className={emptyVariants({ tone, padded, align })} style={style}>
      {children}
    </div>
  )
}
