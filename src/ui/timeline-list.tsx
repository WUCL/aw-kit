// 2026-11-19 自 inknock `src/shared/ui/timeline-list.tsx` 原樣搬入（inknock ADR 0002 D2 批）；註解中的 DESIGN.md／DECISIONS／批次指 inknock 的紀錄。
// 時間軸列表（點＋線＋卡片）：訂單異動紀錄（TransactionTimelinePanel）與人員異動紀錄（StaffTimeline）共用。
// 由 TransactionTimelinePanel 抽出，樣式一行未動（mockup：tmp/mockup-transaction-timeline.html）。
import type { CSSProperties } from 'react'
import { Chip } from './chip'
import { useTheme } from './theme-context'

export type TimelineLineView = {
  /** set＝內容；change＝from→to；add／remove＝新增／移除一列 */
  op: 'set' | 'change' | 'add' | 'remove'
  label: string
  from?: string
  to?: string
  text?: string
}
export type TimelineToneView = 'create' | 'restore' | 'void' | 'refund' | 'default'
export type TimelineEntryView = {
  key: string
  tone: TimelineToneView
  title: string
  /** 總帳用主色淡底 */
  actor: { label: string; ledger: boolean }
  timeText: string
  lines: TimelineLineView[]
}

function ActorChip({ label, ledger }: { label: string; ledger: boolean }) {
  return <Chip tone={ledger ? 'accent' : undefined}>{label}</Chip>
}

function Line({ line }: { line: TimelineLineView }) {
  const T = useTheme()
  const op = line.op
  const tag = op === 'add' ? '新增' : op === 'remove' ? '移除' : null
  const tagStyle: CSSProperties = {
    display: 'inline-flex', alignItems: 'center', padding: '1px 6px', borderRadius: T.radius.xs,
    fontSize: T.fontSize.caption, fontWeight: T.fontWeight.semibold, flexShrink: 0,
    background: op === 'add' ? T.accent50 : T.neutralSunken,
    color: op === 'add' ? T.accent600 : T.inkMuted, // audit-ok: accentAsText — 新增小標籤
  }
  return (
    <div style={{ display: 'flex', gap: T.gap.stack, alignItems: 'baseline', padding: `${T.spacing.sm}px 0`, borderBottom: `1px solid ${T.line}`, fontSize: T.fontSize.body }}>
      <span style={{ width: 84, flexShrink: 0, color: T.inkMuted, fontWeight: T.fontWeight.semibold, fontSize: T.fontSize.meta }}>{line.label}</span>
      <span style={{ flex: 1, minWidth: 0, display: 'flex', flexWrap: 'wrap', gap: `${T.spacing.xs}px ${T.spacing.sm}px`, alignItems: 'baseline', fontVariantNumeric: 'tabular-nums', overflowWrap: 'anywhere' }}>
        {tag && <span style={tagStyle}>{tag}</span>}
        {op === 'change' ? (
          <>
            <span style={{ color: T.inkFaint, textDecoration: 'line-through', textDecorationColor: T.lineStrong }}>{line.from}</span>
            <span style={{ color: T.inkFaint }}>→</span>
            <span style={{ fontWeight: T.fontWeight.semibold }}>{line.to}</span>
          </>
        ) : (
          <span style={{ fontWeight: op === 'remove' ? T.fontWeight.normal : T.fontWeight.semibold, color: op === 'remove' ? T.inkMuted : T.ink }}>{line.text}</span>
        )}
      </span>
    </div>
  )
}

function dotStyle(T: ReturnType<typeof useTheme>, tone: TimelineToneView): CSSProperties {
  const solid = (c: string): CSSProperties => ({ background: c, border: `2px solid ${c}` })
  const base: CSSProperties = { position: 'absolute', left: 0, top: 4, width: 15, height: 15, borderRadius: '50%', background: T.surface, border: `2px solid ${T.lineControl}` }
  if (tone === 'create') return { ...base, ...solid(T.accent600) }
  if (tone === 'restore') return { ...base, border: `2px solid ${T.accent600}` }
  if (tone === 'void') return { ...base, ...solid(T.lineControl) }
  if (tone === 'refund') return { ...base, ...solid(T.state.danger.dark) }  // 只有退費用紅
  return base
}

function Entry({ e, last }: { e: TimelineEntryView; last: boolean }) {
  const T = useTheme()
  return (
    <li style={{ position: 'relative', padding: `0 0 ${last ? 0 : T.spacing.xl + 2}px 28px` }}>
      {!last && <span aria-hidden style={{ position: 'absolute', left: 7, top: 20, bottom: -2, width: 1, background: T.lineSection }} />}
      <span aria-hidden style={dotStyle(T, e.tone)} />
      <div style={{ display: 'flex', alignItems: 'center', gap: T.gap.inline, flexWrap: 'wrap' }}>
        <span style={{ fontSize: T.fontSize.body, fontWeight: T.fontWeight.semibold }}>{e.title}</span>
        <ActorChip {...e.actor} />
      </div>
      <div style={{ fontSize: T.fontSize.meta, color: T.inkFaint, fontVariantNumeric: 'tabular-nums', marginTop: 1 }}>{e.timeText}</div>
      <div style={{ marginTop: T.spacing.sm, background: T.surfaceSunken, border: `1px solid ${T.lineStrong}`, borderRadius: T.radius.lg, padding: `${T.spacing.xs}px 14px` }}>
        {e.lines.map((l, i) => <Line key={i} line={l} />)}
      </div>
    </li>
  )
}


export function TimelineList({ entries }: { entries: ReadonlyArray<TimelineEntryView> }) {
  return (
    <ol style={{ listStyle: 'none', margin: 0, padding: 0 }}>
      {entries.map((e, i) => <Entry key={e.key} e={e} last={i === entries.length - 1} />)}
    </ol>
  )
}
