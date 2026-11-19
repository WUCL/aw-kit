// 2026-11-19 自 inknock `src/shared/ui/sort-select.tsx` 原樣搬入（inknock ADR 0002 D3 批）；註解中的 DESIGN.md／DECISIONS／批次指 inknock 的紀錄。
import { useTheme } from './theme-context'
import { Select } from './select'

/** 工具列常駐排序下拉。抽出前 `CustomersView.tsx`／`InventoryProductsPage.tsx`
    各寫一份幾乎相同的「label ＋ select」JSX 與 selectStyle（後者甚至已經
    跟前者的 `T.controlH.md`／`T.surface` 漂移成 `height:44`／`#fff`）——
    2026-09-25 使用者要求兩處統一，順手模組化，往後第三處直接套用即可。
    2026-09-25 二次修訂：改吃共用的 `Select` 元件（自訂下拉箭頭／對焦變色），
    不再自己手刻 selectStyle——跟清單頁其他篩選欄位共用同一顆 primitive。 */
export function SortSelect<T extends string>({ label = '排序', ariaLabel, value, onChange, options }: {
  label?: string
  ariaLabel: string
  value: T
  onChange: (v: T) => void
  options: { value: T; label: string }[]
}) {
  const theme = useTheme()
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: theme.gap.icon, fontSize: theme.fontSize.body, color: theme.inkMuted, whiteSpace: 'nowrap', flexShrink: 0 }}>
      {label}
      <Select
        aria-label={ariaLabel}
        fullWidth={false}
        value={value}
        onChange={e => onChange(e.target.value as T)}
        style={{ flexShrink: 0 }}
      >
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </Select>
    </div>
  )
}
