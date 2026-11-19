// 2026-11-19 自 inknock `src/shared/ui/clamp-text.tsx` 原樣搬入（inknock ADR 0002 D1 批）；註解中的 DESIGN.md／DECISIONS／批次指 inknock 的紀錄。
import type { ReactNode } from 'react'

/**
 * 多行截斷 —— `-webkit-line-clamp`。
 *
 * ⚠️ 2026-09-10：訂單紀錄／訂單明細的客戶名欄原本單行 `text-overflow: ellipsis`，
 * 實測按訂單加權 16.3% 的名字被切（>7 字 9%）。使用者：改成最多 2 行、再長才截。
 *
 * ⚠️ 必須套在**行內的 span** 上（不是 `<td>`）：`display: -webkit-box` 會破壞
 * `table-cell` 的版面。呼叫端在 `render` 裡包一層。
 */
export function ClampText({ lines = 2, children }: { lines?: number; children: ReactNode }) {
  return (
    <span
      style={{
        display: '-webkit-box',
        WebkitLineClamp: lines,
        WebkitBoxOrient: 'vertical',
        overflow: 'hidden',
        wordBreak: 'break-word',
      }}
    >
      {children}
    </span>
  )
}
