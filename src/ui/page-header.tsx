// 2026-11-19 自 inknock `src/shared/ui/page-header.tsx` 原樣搬入（inknock ADR 0002 D2 批）；註解中的 DESIGN.md／DECISIONS／批次指 inknock 的紀錄。
import { type ReactNode } from 'react'
import { useTheme } from './theme-context'

interface PageHeaderProps {
  title: string
  description?: ReactNode
  /** 右側操作區（例如按鈕、篩選器），桌機靠右、手機換行到下方 */
  actions?: ReactNode
}

export function PageHeader({ title, description, actions }: PageHeaderProps) {
  const T = useTheme()

  return (
    <div style={{
      display: 'flex',
      alignItems: actions ? 'flex-start' : 'center',
      justifyContent: 'space-between',
      gap: T.gap.stack,
      flexWrap: 'wrap',
    }}>
      <div>
        <div style={{
          fontSize: T.fontSize.pageTitle,
          // 頁面標題以中文為主 → 封頂 semibold(600)。原為 800，但 PingFang 最粗只到 600，
          // 那是瀏覽器合成的假粗體（邊緣糊）；改用真實字重反而更銳利。
          fontWeight: T.fontWeight.semibold,
          color: T.ink,
          letterSpacing: '-0.5px',
          lineHeight: T.lineHeight.tight,
          fontFamily: T.font,
        }}>
          {title}
        </div>
        {description && (
          <div style={{
            fontSize: T.fontSize.body,
            color: T.inkMuted,
            marginTop: T.spacing.xs,
            fontFamily: T.font,
            lineHeight: T.lineHeight.body,
          }}>
            {description}
          </div>
        )}
      </div>
      {actions}
    </div>
  )
}
