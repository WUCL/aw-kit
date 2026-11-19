// 2026-11-19 自 inknock `src/shared/ui/interactive.ts` 原樣搬入（inknock ADR 0002 C 批）；註解中的 DECISIONS／CLAUDE.md／日期指 inknock 的紀錄。
import type { SyntheticEvent } from 'react'

/**
 * 「可點的東西」的 selector——全站唯一一份（2026-11-17 第 20 批補審自 tooltip.tsx 抽出）。
 * Tooltip（被點的元素或外層符合 → 不出說明）與 Pressable（事件來自內層的這些元素 → 留給它們自己）共用。
 * roving tabindex 的非作用項靠 role 認出來；可聚焦的只認 DataTable 的列（tr／li）——任意 [tabindex]
 * 會把可聚焦的捲動容器也算進去，裡面的提示全失效（tooltip 補審）。
 */
export const INTERACTIVE_SELECTOR = 'button, a[href], input, select, textarea, summary, label, [role="button"], [role="link"], [role="checkbox"], [role="switch"], [role="radio"], [role="tab"], [role="menuitem"], [role="option"], tr[tabindex]:not([tabindex="-1"]), li[tabindex]:not([tabindex="-1"])'

/**
 * 整塊可點的區塊（Pressable、可點的 Card）用：這個事件不該觸發整塊——
 * - 來自內層的可互動元素（按鈕、連結、欄位、label、選項）：留給它們自己
 * - 不在自己的 DOM 裡（portal 出去的浮框、確認框：React 事件沿元件樹冒泡上來，DOM 上卻不是子孫）
 * 2026-11-17 第 25 批 review：原本 Pressable 與銷售摘要卡片各寫一份，後者漏了 portal 那條。
 */
export function isFromInnerControl(e: SyntheticEvent<HTMLElement>): boolean {
  const t = e.target as Element
  if (!e.currentTarget.contains(t)) return true
  const inner = t.closest?.(INTERACTIVE_SELECTOR)
  return !!inner && inner !== e.currentTarget
}
