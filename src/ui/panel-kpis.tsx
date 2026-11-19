// 2026-11-19 自 inknock `src/shared/ui/panel-kpis.tsx` 原樣搬入（inknock ADR 0002 D2 批）；註解中的 DESIGN.md／DECISIONS／批次指 inknock 的紀錄。
import { useTheme } from './theme-context'

/**
 * 面板頂部的數字格列——label 在上、value 在下，等寬 N 格、淺底描邊。
 *
 * ⚠️ 2026-09-11 從 `features/dashboard/ui/order-bits` 搬到 shared：
 * 客戶面板（CustomerPanel）的 Hero 統計原本自己刻一套（value 用 `amount` 30、
 * 綠色、label 在下），`$64,900` 這種金額在窄面板／巢狀層被 `ellipsis` 切掉。
 * 改用這個共用 layout（value 用 `title` 20、中性色）——同一種東西不要兩種畫法。
 *
 * value 一律 `title`（20）而非 `amount`（30）：面板寬度有限、又要並排 3 格，
 * 30 級的金額字串必被截。要看更精確的數字往下有 Tab／小節。
 */
export function PanelKpis({ items, weight = 'bold' }: {
  /** `onClick` 有給就渲染成按鈕：標籤列右端「›」、hover 邊框變主色——「前往下一層」的提示
   *  （2026-09-17 設計師面板「總訂單」開第二層）。沒給就是純顯示格。 */
  items: { label: string; value: string; onClick?: () => void; ariaLabel?: string }[]
  /** value 的字重。預設 bold（數字／金額）；**文字值（人名、店名）請傳 semibold**——
   *  中文字重上限 600，700 在 PingFang 會是合成假粗體（CLAUDE.md 字體規則）。 */
  weight?: 'bold' | 'semibold'
}) {
  const T = useTheme()
  return (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${items.length}, 1fr)`, gap: T.gap.inline }}>
      {items.map(k => {
        const clickable = !!k.onClick
        const Tag: 'button' | 'div' = clickable ? 'button' : 'div'
        return (
        <Tag key={k.label}
          // audit-ok: bareControl — KPI 格本身就是版面，套 Button 會多出高度與字重
          type={clickable ? 'button' : undefined}
          onClick={k.onClick}
          aria-label={clickable ? (k.ariaLabel ?? `${k.label}：查看明細`) : undefined}
          className={clickable ? 'focus-ring' : undefined}
          onMouseEnter={clickable ? e => { e.currentTarget.style.borderColor = T.accent600 } : undefined}
          onMouseLeave={clickable ? e => { e.currentTarget.style.borderColor = T.lineStrong } : undefined}
          style={{
            // 外框走 lineStrong（DESIGN.md：line 只給容器裡面的列分隔；2026-09-17 使用者抓到太淡）
            background: T.surfaceSunken, border: `1px solid ${T.lineStrong}`,
            borderRadius: T.radius.sm, padding: `${T.spacing.sm}px ${T.spacing.md}px`,
            minWidth: 0, textAlign: 'left', fontFamily: T.font,
            cursor: clickable ? 'pointer' : undefined, transition: `border-color ${T.motion.base} ease`,
          }}>
          <div style={{ fontSize: T.fontSize.caption, color: T.inkFaint, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>{k.label}</span>
            {clickable && (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <polyline points="9 18 15 12 9 6"/>
              </svg>
            )}
          </div>
          {/* ⚠️ 單行 ellipsis 是刻意的（KPI 要能一眼掃過，不可換行把格子撐高），
              但值不一定是數字——領料面板拿它放「領料人／領用店」這類長度不定的文字，
              手機上兩格各只剩約 115px，6 個中文就會被截成「台北信義…」。
              所以一律補 title：截掉的內容至少 hover／長按看得到，不會就這樣消失。
              （Codex review P2，2026-09-16） */}
          <div title={typeof k.value === 'string' || typeof k.value === 'number' ? String(k.value) : undefined}
            style={{
              fontSize: T.fontSize.title, fontWeight: weight === 'bold' ? T.fontWeight.bold : T.fontWeight.semibold,
              color: T.ink, marginTop: 1,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>{k.value}</div>
        </Tag>
        )
      })}
    </div>
  )
}
