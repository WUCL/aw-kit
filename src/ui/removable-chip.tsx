// 2026-11-19 自 inknock `src/shared/ui/removable-chip.tsx` 原樣搬入（inknock ADR 0002 D1 批）；註解中的 DESIGN.md／DECISIONS／批次指 inknock 的紀錄。
import { IconButton } from './icon-button'
import { CloseIcon } from './close-icon'
import { removableChipClassName } from './primitives/chip'

/**
 * 「已套用條件」chip：文字＋移除鈕。FilterBar 與各清單頁的條件 chip 共用這一份（2026-10-20 自 FilterBar 抽出，
 * 避免第二份手刻）。`label` 要是完整描述（例：「設計師：小美」），移除鈕的 aria-label 由它組出。
 */
export function RemovableChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    // 外觀走 primitives/chip.tsx 的 class（2026-11-15，外觀不變）。不固定高度：高度由內層的移除鈕＋1px 外框撐出（固定會讓鈕溢出框外）
    <span className={removableChipClassName}>
      {label}
      <IconButton
        label={`移除條件：${label}`}
        size="xs"
        variant="ghost"
        onClick={onRemove}
      >
        <CloseIcon size={12} />
      </IconButton>
    </span>
  )
}
