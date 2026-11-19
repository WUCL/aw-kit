// 2026-11-19 自 inknock `src/shared/ui/filter-toggle.tsx` 原樣搬入（inknock ADR 0002 D2 批）；註解中的 DESIGN.md／DECISIONS／批次指 inknock 的紀錄。
import { useTheme } from './theme-context'

interface FilterToggleProps {
  open: boolean
  onToggle: () => void
  /**
   * 收合區裡目前是否有生效的條件。
   * ⚠️ 這個點不是裝飾——條件收起來之後，使用者無從得知結果被篩過。
   * 沒有它，「為什麼只有三筆」會變成客服問題。
   */
  active: boolean
  label?: string
  /**
   * 有給＝改成「漏斗＋文字」鈕（例：FilterBar 的「篩選（n）」）：文字本身就是可存取名稱（不再設 aria-label／title），
   * 生效條件數已寫在文字裡，故不畫角落的 active 點。不給＝原本的純圖示鈕（搜尋＋漏斗）。
   */
  text?: string
  /** 控制項高度。預設 md（手機 lg）；篩選列是密集區，FilterBar 傳 `sm`（固定 32） */
  size?: 'sm' | 'md'
  /** 它控制的展開區 id。只在 `open` 時才輸出 aria-controls（收起時該元素不在 DOM，指向不存在的 id 是壞參照） */
  controls?: string
}

const SearchIcon = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="7" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
)

const FilterIcon = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="4" y1="7" x2="20" y2="7" />
    <line x1="7" y1="12" x2="17" y2="12" />
    <line x1="10" y1="17" x2="14" y2="17" />
  </svg>
)

/**
 * 搜尋／進階篩選的開關 — 對標 Polaris `SearchFilterButton`。
 *
 * Polaris 的 `IndexFilters` 預設模式只顯示這一顆按鈕（放大鏡 ＋ 漏斗），
 * 點了才進入 filtering 模式展開搜尋欄（`IndexFilters.tsx:423`）。
 * 桌機與手機同一套行為，不為斷點寫兩種。
 *
 * ⚠️ 收進來的只該是**不常用**的條件（搜尋、日期區間）。
 * 常用的（時間快篩、設計師）要留在外面——收合的目的是把版位還給常用的東西，
 * 不是把所有東西都藏起來。
 */
export function FilterToggle({ open, onToggle, active, label = '搜尋與進階篩選', text, size, controls }: FilterToggleProps) {
  const T = useTheme()
  const h = size === 'sm' ? T.controlH.sm : T.controlH.md

  return (
    <button
      // audit-ok: bareControl — 純圖示開關，寬高相等且無文字，
      //   套 Button 會被水平 padding 撐成長方形
      type="button"
      className="focus-ring hit-area"
      onClick={onToggle}
      aria-expanded={open}
      aria-controls={open ? controls : undefined}
      aria-label={text ? undefined : label}
      title={text ? undefined : label}
      style={{
        position: 'relative',
        height: h,
        padding: `0 ${T.pad.control + 2}px`,
        display: 'inline-flex',
        alignItems: 'center',
        gap: T.gap.hairline,
        flexShrink: 0,
        borderRadius: T.radius.md,
        border: `1px solid ${open ? T.inkSurface : T.lineControl}`,
        background: open ? T.neutralSunken : T.surface,
        color: T.inkMuted,
        ...(text && { fontSize: T.fontSize.meta, whiteSpace: 'nowrap' as const }),
        cursor: 'pointer',
        transition: `background ${T.motion.base} ease, border-color ${T.motion.base} ease`,
      }}
    >
      {text ? <>{FilterIcon}{text}</> : <>{SearchIcon}{FilterIcon}</>}
      {active && !text && (
        <span
          aria-hidden
          style={{
            position: 'absolute',
            top: -3,
            right: -3,
            width: 8,
            height: 8,
            borderRadius: T.radius.xs,
            background: T.accent600,
            border: `1.5px solid ${T.surface}`,
          }}
        />
      )}
    </button>
  )
}
