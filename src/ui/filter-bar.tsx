// 2026-11-19 自 inknock `src/shared/ui/filter-bar.tsx` 原樣搬入（inknock ADR 0002 D3 批）；註解中的 DESIGN.md／DECISIONS／批次指 inknock 的紀錄。
import { useId, type ReactNode } from 'react'
import { Card } from './card'
import { Input } from './input'
import { Button } from './button'
import { RemovableChip } from './removable-chip'
import { FilterToggle } from './filter-toggle'
import { useTheme } from './theme-context'
import { useIsMobile } from './breakpoints'
import { GAP, SPACING } from './theme'

export interface FilterChip {
  key: string
  /** 完整描述，例如「設計師：小美」。移除鈕的 aria-label 由它組出 */
  label: string
  onRemove: () => void
}

interface FilterBarProps {
  searchValue: string
  onSearchChange: (v: string) => void
  searchPlaceholder?: string
  /**
   * 搜尋框右側（手機版會換行到下方）的額外控件，例如 select、新增按鈕等。
   * ⚠️ 過渡用：既有兩個使用點（StaffView／ServicesView）還在用。新頁面請用下面的 slots
   * （period／filters／chips／onClear／actions），全部遷完後移除 children，避免一個元件兩條路徑。
   */
  children?: ReactNode

  // ── DESIGN.md §7 的 slots（全為選用；都不傳時渲染結果與舊版相同）──
  /** 期間選擇（放 PeriodPicker），常駐列最左 */
  period?: ReactNode
  /** 進階篩選：「篩選（n）」鈕與展開列。開關狀態由呼叫端 useState 持有（不進網址） */
  filters?: {
    /** 目前生效的條件數；0 不顯示括號 */
    count: number
    open: boolean
    onToggle: () => void
    /** 展開列內容 */
    panel: ReactNode
  }
  /** 已套用條件列。展開列收著時仍顯示；只放「收在展開列、使用者看不到」的條件 */
  chips?: FilterChip[]
  /** 有傳才顯示「清除篩選」；無條件時用 clearDisabled 停用（常駐，不隱藏，版面才不跳動） */
  onClear?: () => void
  clearDisabled?: boolean
  /** 靠右的主要動作（新增、匯出）；手機獨佔一行靠右 */
  actions?: ReactNode
}

const SearchIcon = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
)

export function FilterBar({
  searchValue, onSearchChange, searchPlaceholder = '搜尋...', children,
  period, filters, chips, onClear, clearDisabled, actions,
}: FilterBarProps) {
  const T = useTheme()
  const isMobile = useIsMobile()
  const panelId = useId()
  const hasChips = !!chips && chips.length > 0
  // 任一「新版面」slot 實際出現才換成「可換行的一列」；全舊用法維持原本的版面。
  // ⚠️ onClear 刻意不算：StaffView／ServicesView 只加了清除鈕，手機版面（搜尋一行、下一行 children 左右撐開）
  //    要與舊版一致。空陣列 chips 也不算（hasChips 而非 !!chips）。
  const extended = !!(period || filters || hasChips || actions)

  return (
    <Card style={{ padding: isMobile ? '14px' : '14px 16px' }}>
      <div
        role="search"
        style={{
          display: 'flex',
          flexDirection: isMobile && !extended ? 'column' : 'row',
          // ⚠️ **方向是動態的，所以間距也必須跟著動態**（2026-08-28，批次 7b）。
          //    垂直堆疊需要比水平並排更大的間距才讀得出分組；原本固定 10
          //    等於在兩種方向上都不對。機械分流處理不了這種寫法——
          //    是靠「逐一檢查未指定方向的 28 處」才發現的。
          gap: isMobile && !extended ? GAP.stack : GAP.inline,
          alignItems: isMobile && !extended ? 'stretch' : 'center',
          flexWrap: 'wrap',
        }}
      >
        {period}
        {filters && (
          <FilterToggle
            text={filters.count > 0 ? `篩選（${filters.count}）` : '篩選'}
            size="sm"
            open={filters.open}
            onToggle={filters.onToggle}
            active={filters.count > 0}
            controls={panelId}
          />
        )}
        {/* 清除鈕與搜尋框同組：舊版面（手機 column）下仍是「搜尋一行」，不會多出一行或把 children 擠走 */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: GAP.inline,
          flex: isMobile && extended ? '1 1 100%' : 1,
          minWidth: isMobile ? undefined : 200,
        }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <Input
              value={searchValue}
              onChange={e => onSearchChange(e.target.value)}
              placeholder={searchPlaceholder}
              leftIcon={SearchIcon}
            />
          </div>
          {onClear && (
            <Button variant="ghost" size="sm" onClick={onClear} disabled={clearDisabled} style={{ flexShrink: 0 }}>
              清除篩選
            </Button>
          )}
        </div>
        {children && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: isMobile ? 'space-between' : 'flex-start',
            gap: GAP.inline,
            flexWrap: 'wrap',
          }}>
            {children}
          </div>
        )}
        {actions && (
          <div style={{
            marginLeft: 'auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: GAP.inline,
            flexWrap: 'wrap',
            ...(isMobile && { flexBasis: '100%', marginLeft: 0 }),
          }}>
            {actions}
          </div>
        )}
      </div>

      {filters?.open && (
        <div
          id={panelId}
          style={{
            marginTop: GAP.stack,
            padding: SPACING.md,
            background: T.surfaceSunken,
            borderRadius: T.radius.md,
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
            gap: GAP.stack,
          }}
        >
          {filters.panel}
        </div>
      )}

      {hasChips && (
        <div
          role="group"
          aria-label="已套用的篩選條件"
          style={{ marginTop: GAP.stack, display: 'flex', flexWrap: 'wrap', gap: GAP.inline }}
        >
          {chips!.map(c => <RemovableChip key={c.key} label={c.label} onRemove={c.onRemove} />)}
        </div>
      )}
    </Card>
  )
}
