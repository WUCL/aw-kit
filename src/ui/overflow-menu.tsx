// 2026-11-19 自 inknock `src/shared/ui/overflow-menu.tsx` 原樣搬入（inknock ADR 0002 D3 批）；註解中的 DESIGN.md／DECISIONS／批次指 inknock 的紀錄。
import type { MouseEvent } from 'react'
import { useTheme } from './theme-context'
import { IconButton } from './icon-button'
import { useDropdownMenu } from './use-dropdown-menu'
import { MenuRow, MenuSeparator } from './menu-row'
import { ROW_H } from './theme'

export type OverflowItem = {
  label: string
  onClick: () => void
  /** 破壞性動作（停用／刪除／作廢）——以紅色標示，並排在分隔線之下 */
  danger?: boolean
  disabled?: boolean
}

/**
 * 列動作的溢位選單（⋯）。
 *
 * 存在的理由：表格列原本把「編輯」與「停用／刪除」並排成兩顆外觀完全相同的按鈕、
 * 間距僅 8px。在 iPad 上用手指點，誤觸的那顆是破壞性動作。把破壞性動作收進這裡，
 * 讓它需要「多一個動作」才能觸發，而主要動作維持一鍵。
 *
 * 定位、關閉、鍵盤與焦點走共用的 `use-dropdown-menu.ts`；外觀走 shadcn 選單的 class
 * （`primitives/dropdown-menu.tsx`，2026-11-15 使用者看比較頁確認），與 PeriodPicker 同一套。
 */
export function OverflowMenu({ items, label = '更多動作', disabled = false }: {
  items: OverflowItem[]; label?: string
  disabled?: boolean
}) {
  const T = useTheme()
  const hasSep = items.some(i => i.danger) && items.some(i => !i.danger)
  // 首次定位的估計高度：每項一列＋分隔線 9＋上下內距 8（掛載後以實測校正）
  const { triggerRef, menuRef, ...menu } = useDropdownMenu({
    align: 'end', minWidth: 168,
    estimateHeight: () => items.length * ROW_H.touch + (hasSep ? 9 : 0) + 8,
    // 開著時項目變了（狀態更新後多／少一個動作）要重新定位
    remeasureKey: items.map(i => `${i.label}${i.danger ? '!' : ''}`).join('|'),
  })
  const pick = (it: OverflowItem, e: MouseEvent) => { menu.select(e); it.onClick() }

  const safe = items.filter(i => !i.danger)
  const risky = items.filter(i => i.danger)

  return (
    <>
      {/* 觸發鈕用共用 IconButton：尺寸跟 Button／Select 同一套 T.controlH（桌機手機相同）。
          原本手刻、寫死 44，2026-09-30 放進訂單紀錄篩選列時比鄰居大一圈。 */}
      <IconButton
        ref={triggerRef}
        label={label}
        disabled={disabled}
        {...menu.triggerProps}
        onClick={menu.toggle}
        // 展開中的灰底由 IconButton 依 aria-expanded 自己畫（2026-11-16 換新）
        style={{ fontSize: T.fontSize.title }}
      >
        ⋯
      </IconButton>

      {menu.mounted && (
        <div ref={menuRef} {...menu.menuProps} aria-label={label}>
          {safe.map(it => <OverflowRow key={it.label} item={it} onPick={pick} />)}
          {hasSep && <MenuSeparator />}
          {risky.map(it => <OverflowRow key={it.label} item={it} onPick={pick} />)}
        </div>
      )}
    </>
  )
}

function OverflowRow({ item, onPick }: { item: OverflowItem; onPick: (it: OverflowItem, e: MouseEvent) => void }) {
  return (
    <MenuRow
      role="menuitem"
      danger={item.danger}
      disabled={item.disabled}
      onClick={e => { if (!item.disabled) onPick(item, e) }}
    >
      {item.label}
    </MenuRow>
  )
}
