// 2026-11-19 自 inknock `src/shared/ui/callout.tsx` 原樣搬入（inknock ADR 0002 D1 批）；註解中的 DESIGN.md／DECISIONS／批次指 inknock 的紀錄。
import type { ReactNode } from 'react'
import { calloutVariants } from './primitives/alert'
import { Button } from './button'

/**
 * ②b 提示列（QuickView 收斂，DECISIONS 2026-10-14）：面板內「資料待處理」才渲染的一條提示。
 * 色票（warning＝待處理；info＝中性說明）在 primitives/alert.tsx，按鈕固定 Button sm。沒有待處理就不要渲染它。
 */
export function Callout({ tone, action, children }: {
  tone: 'warning' | 'info'
  action?: { label: string; onClick: () => void }
  children: ReactNode
}) {
  // 外觀走 primitives/alert.tsx 的 class（2026-11-15 改走 class，外觀不變）
  return (
    <div role={tone === 'warning' ? 'alert' : 'status'} className={calloutVariants({ tone })}>
      <span className="min-w-0 flex-1">{children}</span>
      {action && <Button size="sm" variant="secondary" onClick={action.onClick}>{action.label}</Button>}
    </div>
  )
}
