// 2026-11-19 自 inknock `src/shared/ui/section-title.tsx` 原樣搬入（inknock ADR 0002 D2 批）；註解中的 DESIGN.md／DECISIONS／批次指 inknock 的紀錄。
// 區段／小節標題的唯一實作（2026-09-17）。
//
// 為什麼要有這支：面板小節（基本資料、操作）、卡片內分組（價格、其他）、清單表頭
// 原本各自手刻同一組「caption 12 ＋ uppercase ＋ letter-spacing」——那是給拉丁小標的處理，
// uppercase 對中文無效、letter-spacing 只讓 12px 更瘦（DESIGN.md「Uppercase-Does-Nothing」），
// 使用者在設計師頁一眼看出四處三種大小。統一為 meta(13)／600／inkMuted，與 DataTable 表頭同級。
import type { CSSProperties, ReactNode } from 'react'
import { useTheme } from './theme-context'

export function SectionTitle({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  const T = useTheme()
  return (
    <div style={{
      fontSize: T.fontSize.meta, fontWeight: T.fontWeight.semibold, color: T.inkMuted,
      lineHeight: T.lineHeight.snug, marginBottom: T.spacing.md, fontFamily: T.font,
      ...style,
    }}>{children}</div>
  )
}
