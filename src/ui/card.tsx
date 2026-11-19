// 2026-11-19 自 inknock `src/shared/ui/card.tsx` 原樣搬入（inknock ADR 0002 D1 批）；註解中的 DESIGN.md／DECISIONS／批次指 inknock 的紀錄。
// Card 包裝層（ADR 0001；2026-11-15 改走 class，外觀不變）。對外 props 不變（children／style／onClick／hoverable）。
//
// ⚠️ 根元素**刻意不帶 `data-slot`**：限定子樹的 preflight（`[data-slot] *`）會作用到整張卡片的內容——
// 卡片裝的是頁面本身（標題、按鈕、表格、svg），帶上就等於把 Tailwind reset 套進 19 個呼叫端的頁面
// （ADR 0001〈並存〉規則 ②）。卡片自己只用到 border／radius／背景，這幾個 class 不靠 reset 也正確
// （Tailwind v4 的 `border` 自帶 border-style）。全站轉完、換回原版 preflight 時再補 data-slot。
import type { CSSProperties, MouseEvent, ReactNode } from 'react'
import { cardClassName } from './primitives/card'
import { cn } from './cn'

export function Card({
  children,
  style,
  onClick,
  hoverable,
}: {
  children: ReactNode
  style?: CSSProperties
  /** 整張卡片可點（滑鼠捷徑）。卡片裡有按鈕／連結時，呼叫端用事件判斷略過（例：銷售摘要卡），鍵盤入口放在卡片內的按鈕 */
  onClick?: (e: MouseEvent<HTMLDivElement>) => void
  hoverable?: boolean
}) {
  return (
    <div
      onClick={onClick}
      className={cn(
        cardClassName,
        // hover 只加深邊框，不換陰影。柔邊陰影全站只給真的浮起來的東西
        // （選單／面板／Modal）——見 DESIGN.md 的 The Shadow-Is-A-Line Rule。
        // ⚠️ 容器**本身**的邊界用 lineStrong；line 是容器**裡面**的分隔（列與列），
        //    lineSection 是卡片內的區段分隔；lineControl 只給可互動控制項。四者不可互換。
        // 換 class 前是 JS 的 mouseenter／mouseleave；hover: 只在有滑鼠的裝置生效（Tailwind v4 包在
        // @media (hover: hover)），iPad 點一下不再殘留深色外框——桌機外觀相同。
        hoverable && 'hover:border-ink',
        onClick ? 'cursor-pointer' : 'cursor-default',
      )}
      style={style}
    >
      {children}
    </div>
  )
}
