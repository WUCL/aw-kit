// 2026-11-19 自 inknock `src/shared/ui/condensed-row.tsx` 原樣搬入（inknock ADR 0002 D2 批）；註解中的 DESIGN.md／DECISIONS／批次指 inknock 的紀錄。
import type { ReactNode } from 'react'
import { useTheme } from './theme-context'

interface CondensedRowProps {
  /** 第一行：參照碼、日期這類「輔助定位」資訊 */
  meta?: ReactNode
  /** 第二行左：這一列是誰 */
  title: ReactNode
  /** 第二行右：結果值（金額、數量） */
  value?: ReactNode
  /** 第三行：徽章、分類 chips */
  tags?: ReactNode
  /** 值下方、靠右（第三行右側）：狀態徽章。與 tags 同在第三行，不會把第二行撐高。 */
  valueSub?: ReactNode
}

/**
 * 窄螢幕的列內容 — 三行結構，字級與字重由元件寫死。
 *
 * 結構對標 Polaris 官方 `index-table-small-screen` 範例：
 *   ① 參照碼 ・ 日期      bodySm / subdued   ← 合併在最上面
 *   ② 名稱（粗）｜ 值      bodyMd            ← 一行兩端
 *   ③ 徽章
 *
 * ⚠️ 為什麼參照碼放最上面而不是名字底下：它與日期都是「輔助定位」，
 * 放同一行比分散在上下兩處好掃；名字與值才是要對照著看的一組。
 *
 * ⚠️ **偏離 Polaris 一處**：值用 700 ＋ tabular，Polaris 是 regular。
 * 理由是我們桌機表格的「結果欄」規則就是 700（DESIGN.md → The One Size Rule），
 * 手機跟著才是同一套規則；且美業老闆掃列表時第一個找的就是金額。
 * Shopify 的情境是電商訂單，客戶名比金額重要，那是不同的取捨。
 *
 * ⚠️ 這裡刻意不提供「自由排版」的逃生口。層級一旦可以逐頁覆寫，
 * 六個頁面就會長出六種——那正是收斂之前的狀態。
 */
export function CondensedRow({ meta, title, value, tags, valueSub }: CondensedRowProps) {
  const T = useTheme()
  if (valueSub) {
    // 兩欄網格：左欄 meta／title／tags 三行，右欄 value（第二行）＋ valueSub（第三行）。
    // 同列共用列高，右欄不會把左欄撐出空白。
    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) auto', columnGap: T.gap.stack, rowGap: T.gap.hairline, alignItems: 'baseline' }}>
        {meta && (
          <div style={{ gridColumn: 1, gridRow: 1, fontSize: T.fontSize.meta, color: T.inkFaint, fontVariantNumeric: 'tabular-nums', lineHeight: T.lineHeight.snug }}>
            {meta}
          </div>
        )}
        <span style={{ gridColumn: 1, gridRow: 2, fontSize: T.fontSize.body, fontWeight: T.fontWeight.semibold, color: T.ink, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {title}
        </span>
        {value !== undefined && value !== null && (
          <span style={{ gridColumn: 2, gridRow: 2, justifySelf: 'end', fontSize: T.fontSize.body, fontWeight: T.fontWeight.bold, color: T.ink, fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>
            {value}
          </span>
        )}
        <div style={{ gridColumn: 1, gridRow: 3, display: 'flex', gap: T.gap.inline, flexWrap: 'wrap', alignItems: 'center', marginTop: T.spacing['2xs'], minWidth: 0 }}>
          {tags}
        </div>
        <div data-testid="condensed-value-sub" style={{ gridColumn: 2, gridRow: 3, justifySelf: 'end', alignSelf: 'start', marginTop: T.spacing['2xs'] }}>
          {valueSub}
        </div>
      </div>
    )
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: T.gap.hairline }}>
      {meta && (
        <div
          style={{
            fontSize: T.fontSize.meta,
            color: T.inkFaint,
            fontVariantNumeric: 'tabular-nums',
            lineHeight: T.lineHeight.snug,
          }}
        >
          {meta}
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: T.gap.stack }}>
        <span
          style={{
            fontSize: T.fontSize.body,
            fontWeight: T.fontWeight.semibold,
            color: T.ink,
            minWidth: 0,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {title}
        </span>
        {value !== undefined && value !== null && (
          <span
            style={{
              fontSize: T.fontSize.body,
              fontWeight: T.fontWeight.bold,
              color: T.ink,
              fontVariantNumeric: 'tabular-nums',
              whiteSpace: 'nowrap',
              flexShrink: 0,
            }}
          >
            {value}
          </span>
        )}
      </div>

      {tags && (
        <div style={{ display: 'flex', gap: T.gap.inline, flexWrap: 'wrap', alignItems: 'center', marginTop: T.spacing['2xs'] }}>
          {tags}
        </div>
      )}
    </div>
  )
}
