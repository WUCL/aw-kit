// 2026-11-19 自 inknock `src/shared/ui/panel-section.tsx` 原樣搬入（inknock ADR 0002 D2 批）；註解中的 DESIGN.md／DECISIONS／批次指 inknock 的紀錄。
import { Children, isValidElement, type ReactNode } from 'react'
import { useTheme } from './theme-context'

/**
 * 側邊面板的內容排版 — 全站共用。
 *
 * ⚠️ **為什麼要有這支**：訂單 / 客戶 / 預約三個面板原本各自手寫鍵值排版，
 * 於是「同一種東西」在三個面板長成三種樣子（memory `feedback-two-paths-one-feature`：
 * 顯示點分散與寫入點分散是同一個問題）。要改就三個一起改，靠的是共用元件而非自律。
 *
 * ⚠️ **容器語言**：一個容器 ＋ 髮絲線分隔，與 `DataTable` 同一套。
 * **不要在面板裡再包灰底盒子**——那會變成「卡片裡包著一堆小卡片」，
 * 密度沒增加、邊界卻多了三層（2026-08-26 QuickView 改版的主因）。
 */
export function PanelSection({
  title,
  children,
  total,
}: {
  title: string
  children: ReactNode
  /** 清單結尾的合計列。給了才出現，上緣是較深的 `lineSection`，與列間髮絲線區分。 */
  total?: { label: string; value: ReactNode }
}) {
  const T = useTheme()
  const rows = Children.toArray(children).filter(c => isValidElement(c) || typeof c === 'string')

  return (
    <div style={{ marginTop: T.spacing.xl }}>
      <div
        style={{
          fontSize: T.fontSize.meta,
          fontWeight: T.fontWeight.semibold,
          color: T.inkMuted,
          paddingBottom: T.gap.icon,
          borderBottom: `1px solid ${T.lineSection}`,
          marginBottom: T.spacing['2xs'],
        }}
      >
        {title}
      </div>

      {rows.map((row, i) => (
        // 分隔線畫在「除了第一列以外的每一列上緣」，效果等同 last-child 不畫下緣，
        // 但不需要 CSS 選擇器（本專案純 inline style）。
        <div key={i} style={{ borderTop: i === 0 ? 'none' : `1px solid ${T.line}` }}>
          {row}
        </div>
      ))}

      {total && (
        <div
          style={{
            display: 'flex',
            alignItems: 'baseline',
            justifyContent: 'space-between',
            gap: T.gap.field,
            padding: `${T.gap.stack + 2}px 0 2px`,
            borderTop: `1px solid ${T.lineSection}`,
            marginTop: T.spacing['2xs'],
          }}
        >
          <span style={{ fontSize: T.fontSize.body, fontWeight: T.fontWeight.semibold, color: T.ink }}>
            {total.label}
          </span>
          <span
            style={{
              fontSize: T.fontSize.pageTitle,
              fontWeight: T.fontWeight.bold,
              color: T.ink,
              fontVariantNumeric: 'tabular-nums',
              lineHeight: T.lineHeight.amount,
            }}
          >
            {total.value}
          </span>
        </div>
      )}
    </div>
  )
}

/**
 * 鍵值列 — 左標籤、右內容。
 *
 * @param align 內容多行時（例：混合支付逐段列出）用 `top`，讓標籤對齊第一行而不是垂直置中。
 * @param fill  內容需要自己撐滿右側寬度時開啟（分段金額要靠右對齊成一欄）。
 */
export function PanelRow({
  label,
  children,
  align = 'baseline',
  fill = false,
  strong = false,
  muted = false,
}: {
  label: string
  children: ReactNode
  align?: 'baseline' | 'top'
  fill?: boolean
  strong?: boolean
  muted?: boolean
}) {
  const T = useTheme()

  return (
    <div
      style={{
        display: 'flex',
        alignItems: align === 'top' ? 'flex-start' : 'baseline',
        justifyContent: 'space-between',
        gap: T.gap.field,
        padding: '11px 0',
      }}
    >
      <span
        style={{
          fontSize: T.fontSize.body,
          color: T.inkMuted,
          flexShrink: 0,
          paddingTop: align === 'top' ? 1 : undefined,
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontSize: T.fontSize.body,
          fontWeight: strong ? T.fontWeight.semibold : T.fontWeight.normal,
          color: muted ? T.inkFaint : T.ink,
          textAlign: 'right',
          minWidth: 0,
          flex: fill ? 1 : undefined,
        }}
      >
        {children}
      </span>
    </div>
  )
}

/**
 * 清單列 — 自由排版的一行（例：分類 chip ＋ 名稱 ＋ 金額）。
 * 分隔線由 `PanelSection` 負責，這裡只管內距。
 */
export function PanelLine({ children }: { children: ReactNode }) {
  const T = useTheme()
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: T.gap.inline, padding: '11px 0' }}>
      {children}
    </div>
  )
}
