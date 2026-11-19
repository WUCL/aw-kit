// 2026-11-19 自 inknock `src/shared/ui/panel-action-row.tsx` 原樣搬入（inknock ADR 0002 D2 批）；註解中的 DESIGN.md／DECISIONS／批次指 inknock 的紀錄。
import type { ReactNode } from 'react'
import { useTheme } from './theme-context'

/**
 * 面板底部「管理」區的一列：左邊動作名稱＋說明、右邊按鈕（停用、刪除、重設密碼等）。
 * 分店、服務等 QuickView 共用（原本兩頁各自手寫一份，code review 2026-10-08）。
 */
export function PanelActionRow({ label, description, action }: { label: string; description: string; action: ReactNode }) {
  const T = useTheme()
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: T.gap.stack, padding: '10px 0', borderBottom: `1px solid ${T.line}`, fontFamily: T.font }}>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: T.fontSize.meta, fontWeight: 600, color: T.ink }}>{label}</div>
        <div style={{ fontSize: T.fontSize.caption, color: T.inkFaint }}>{description}</div>
      </div>
      <div style={{ flexShrink: 0 }}>{action}</div>
    </div>
  )
}
