// 2026-11-19 自 inknock `src/shared/ui/annotated-section.tsx` 原樣搬入（inknock ADR 0002 D2 批）；註解中的 DESIGN.md／DECISIONS／批次指 inknock 的紀錄。
import type { ReactNode } from 'react'
import { useTheme } from './theme-context'
import { useIsMobile } from './breakpoints'

/**
 * 設定頁的「說明｜內容」兩欄區塊（2026-10-08，DECISIONS「設定區第三輪定案」D；對標 Polaris annotated layout）。
 *
 * 左欄放區塊標題與說明、右欄放卡片控制項，兩欄一起撐滿內容寬度——用到右側空間又不把輸入框拉長。
 * 手機（<768）合併成單欄：標題說明在上、內容在下。
 * 只給「一份表單或一張清單」的設定頁用（店家資訊、密碼鎖、付款方式、方案與功能、關於）；
 * 清單／表格頁（營業時間、分店、服務目錄）維持滿寬單欄。
 */
export function AnnotatedSection({ title, description, children, last }: {
  title: string
  description?: ReactNode
  children: ReactNode
  /** 最後一個區塊不畫底部分隔線 */
  last?: boolean
}) {
  const T = useTheme()
  const isMobile = useIsMobile()
  return (
    <section style={{
      display: 'grid',
      gridTemplateColumns: isMobile ? '1fr' : 'minmax(180px, 1fr) minmax(0, 2.4fr)',
      gap: isMobile ? T.spacing.sm : T.spacing.xl,
      padding: `${T.spacing.lg}px 0`,
      borderBottom: last ? 'none' : `1px solid ${T.lineSection}`,
      fontFamily: T.font,
    }}>
      <div>
        <h2 style={{ margin: 0, fontSize: T.fontSize.body, fontWeight: T.fontWeight.semibold, color: T.ink, lineHeight: T.lineHeight.snug }}>{title}</h2>
        {description && (
          <div style={{ marginTop: T.spacing.xs, fontSize: T.fontSize.meta, color: T.inkMuted }}>{description}</div>
        )}
      </div>
      <div style={{ minWidth: 0 }}>{children}</div>
    </section>
  )
}
