// 2026-11-19 自 inknock `src/shared/ui/stat-card.tsx` 原樣搬入（inknock ADR 0002 D2 批）；註解中的 DESIGN.md／DECISIONS／批次指 inknock 的紀錄。
import type { ReactElement } from "react"
import { Card } from "./card"
import { useIsMobile } from "./breakpoints"
import { useTheme } from "./theme-context"

const ICONS: Record<string, ReactElement> = {
  'dollar-sign': (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="1" x2="12" y2="23"/>
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
    </svg>
  ),
  'calendar': (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="17" rx="2"/>
      <path d="M16 2v4M8 2v4M3 10h18"/>
    </svg>
  ),
  'repeat': (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="17 1 21 5 17 9"/>
      <path d="M3 11V9a4 4 0 0 1 4-4h14"/>
      <polyline points="7 23 3 19 7 15"/>
      <path d="M21 13v2a4 4 0 0 1-4 4H3"/>
    </svg>
  ),
  'users': (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
      <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  ),
}

export function StatCard({
  label,
  value,
  delta,
  icon,
}: {
  label: string
  value: string
  delta?: number
  icon?: string
}) {
  const T = useTheme()
  const positive = (delta ?? 0) > 0
  const isMobile = useIsMobile()

  return (
    <Card style={{ padding: isMobile ? '18px 18px' : '22px 22px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: T.gap.inline }}>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ fontSize: T.fontSize.body, color: T.inkMuted, marginBottom: T.spacing.md }}>
            {label}
          </div>
          <div style={{ fontSize: isMobile ? T.fontSize.amount : T.fontSize.kpi, fontWeight: T.fontWeight.bold, color: T.ink, letterSpacing: '-1px', lineHeight: T.lineHeight.none }}>
            {value}
          </div>
          {delta !== undefined && (
            <div style={{ display: 'flex', alignItems: 'center', gap: T.gap.hairline, marginTop: T.spacing.sm }}>
              {positive ? (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={T.state.success.base} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/>
                </svg>
              ) : (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={T.state.danger.base} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/>
                </svg>
              )}
              <span style={{ fontSize: T.fontSize.body, color: positive ? T.state.success.base : T.state.danger.base, fontWeight: 600 }}>
                {Math.abs(delta)}%
              </span>
              <span style={{ fontSize: T.fontSize.body, color: T.inkFaint }}>vs last month</span>
            </div>
          )}
        </div>
        {icon && (
          <div style={{
            width: isMobile ? 32 : 40,
            height: isMobile ? 32 : 40,
            borderRadius: T.radius.md,
            // ⚠️ 不開放呼叫端指定顏色。原本有個 `color` prop，四個 KPI 各自傳
            //    rgba(168,197,181,.2) / rgba(26,46,37,.08) / rgba(74,139,111,.1) /
            //    rgba(168,197,181,.15)——全是換色前的舊主色，而且在 40px 的方塊上
            //    根本分不出差別。四個不同的「看起來一樣」比一個統一值更糟：
            //    它讓人以為顏色有意義。
            background: T.accent50,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            // 這是**圖示**不是文字。圖示在 accent50 底上用 accent600，
            // 是「主色的淺／深」一組，與「金額不該用主色」是兩件事。
            // audit-ok: accentAsText
            color: T.accent600,
            flexShrink: 0,
          }}>
            {ICONS[icon]}
          </div>
        )}
      </div>
    </Card>
  )
}
