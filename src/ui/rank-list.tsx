// 2026-11-19 自 inknock `src/shared/ui/rank-list.tsx` 原樣搬入（inknock ADR 0002 D2 批）；註解中的 DESIGN.md／DECISIONS／批次指 inknock 的紀錄。
import type { ReactNode } from 'react'
import { useState } from 'react'
import { useTheme } from './theme-context'

export type RankItem = {
  key: string
  name: string
  /** 長度比例 0–100。**只表達相對長度，不是市佔**——標成百分比會說謊 */
  pct: number
  /** 右側主值（筆數或金額） */
  value: ReactNode
  /** 右側副值（例：6 筆 · 客單 $400） */
  sub?: ReactNode
  /** 名稱下方的補充（例：跨店拆解） */
  detail?: ReactNode
  /** 分段長條。給了就取代單色條，用於跨店拆解 */
  segments?: { key: string; pct: number; color: string }[]
}

/**
 * Top N 排行 — 熱門服務與設計師表現共用。
 *
 * ⚠️ **為什麼要有這支**：這兩塊原本在不同列、不同寬度（380px / 320px），
 * 各自手寫一套渲染——同一種東西長成兩種樣子，改要改兩個地方
 * （memory `feedback-two-paths-one-feature`）。並排等寬 ＋ 共用元件之後，
 * 「跨指標比較」才成立：看得出「這位設計師營收第二、客單價卻墊底」。
 *
 * ⚠️ **不顯示百分比數字。** 呼叫端傳進來的 `pct` 是「相對第一名」
 * （第一名恆為 100），不是佔比。標成百分比會被讀成「剪髮佔 100%」。
 * 長度本身就足以表達排序。
 *
 * ⚠️ **沒有頭像。** 設計師列原本有 38px Avatar，吃掉近半寬度；
 * 排行看的是數字不是臉，而且熱門服務沒有頭像——兩邊要對得齊。
 */
export function RankList({
  items,
  onSelect,
  emptyText,
}: {
  items: RankItem[]
  onSelect?: (key: string) => void
  emptyText: string
}) {
  const T = useTheme()

  if (items.length === 0) {
    return (
      <div style={{
        fontSize: T.fontSize.body, color: T.inkFaint, textAlign: 'center',
        padding: '32px 0', fontFamily: T.font,
      }}>
        {emptyText}
      </div>
    )
  }

  return (
    <div>
      {items.map((item, i) => (
        <Row key={item.key} item={item} first={i === 0} rank={i + 1} onSelect={onSelect} />
      ))}
    </div>
  )
}

function Row({
  item, first, rank, onSelect,
}: {
  item: RankItem
  first: boolean
  rank: number
  onSelect?: (key: string) => void
}) {
  const T = useTheme()
  const [hover, setHover] = useState(false)
  const clickable = !!onSelect
  // ⚠️ 只有第一名給主色。原本前三名各一種配色，但顏色表達不了「名次」
  //    （黑不比綠「高」），只是讓清單看起來很花。
  const isTop = rank === 1

  // 🔴 **可點的列必須是可聚焦的控制項**（2026-09-10 Codex review）。
  //    在此之前 `onSelect` 只掛 `onClick` 在裸 `<div>` 上：滑鼠點得到，
  //    但鍵盤使用者連 Tab 都走不到，也看不到焦點環——`DESIGN.md` §8 的
  //    「用 Tab 鍵走一遍，確認焦點環可見」直接不成立。
  //    ⚠️ 這個缺口是**本批才變成真的**：`onSelect` 是這批新增的，
  //    在此之前 RankList 的列純粹是展示，沒有鍵盤可達性可言。
  //    收在共用元件這一層而非兩個呼叫點各補一次（兩處已窮舉：熱門品項、設計師表現）。
  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onClick={clickable ? () => onSelect(item.key) : undefined}
      role={clickable ? 'button' : undefined}
      tabIndex={clickable ? 0 : undefined}
      // 焦點環走全站的 `.focus-ring`（`aw-kit/ui/styles/globals.css`），不在這裡另刻一套 outline。
      className={clickable ? 'focus-ring' : undefined}
      onKeyDown={clickable ? e => {
        // Enter 與 Space 都要——原生 <button> 兩者皆可觸發，這裡是在補回那個行為。
        // Space 必須 preventDefault，否則頁面會捲動。
        // 可點的列（role=button），不是文字欄、不會有輸入法組字
        // eslint-disable-next-line no-restricted-syntax
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onSelect(item.key)
        }
      } : undefined}
      style={{
        display: 'flex', alignItems: 'center', gap: T.gap.inline,
        padding: '9px 6px', margin: '0 -6px',
        borderTop: first ? 'none' : `1px solid ${T.line}`,
        borderRadius: T.radius.sm,
        background: clickable && hover ? T.interaction.hoverSurface : 'transparent',
        cursor: clickable ? 'pointer' : undefined,
        transition: `background ${T.motion.base} ease`,
      }}
    >
      <span
        aria-hidden="true"
        style={{
          width: 22, height: 22, borderRadius: T.radius.pill, flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: T.fontSize.caption, fontWeight: T.fontWeight.bold,
          background: isTop ? T.accent600 : T.neutralSunken,
          color: isTop ? '#FFFFFF' : T.inkFaint,
          border: isTop ? 'none' : `1px solid ${T.lineStrong}`,
        }}
      >
        {rank}
      </span>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: T.fontSize.body, fontWeight: T.fontWeight.semibold, color: T.ink,
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>
          {item.name}
        </div>

        <div style={{
          height: 4, background: T.lineSection, borderRadius: T.radius.xs,
          marginTop: T.spacing.xs, overflow: 'hidden', display: 'flex',
        }}>
          {item.segments
            ? item.segments.map(s => (
                <span key={s.key} style={{ width: `${s.pct}%`, background: s.color, height: '100%' }} />
              ))
            : (
                <span style={{
                  width: `${item.pct}%`, height: '100%',
                  background: isTop ? T.accent600 : T.accent300,
                  borderRadius: T.radius.xs,
                  transition: 'width .5s ease',
                }} />
              )}
        </div>

        {item.detail && (
          <div style={{ fontSize: T.fontSize.caption, color: T.inkFaint, marginTop: T.spacing.xs }}>
            {item.detail}
          </div>
        )}
      </div>

      <div style={{ textAlign: 'right', flexShrink: 0, fontVariantNumeric: 'tabular-nums' }}>
        <div style={{ fontSize: T.fontSize.body, fontWeight: T.fontWeight.bold, color: T.ink }}>
          {item.value}
        </div>
        {item.sub && (
          <div style={{ fontSize: T.fontSize.caption, color: T.inkFaint, marginTop: 1 }}>
            {item.sub}
          </div>
        )}
      </div>
    </div>
  )
}
