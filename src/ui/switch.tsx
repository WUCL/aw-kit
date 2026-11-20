// 2026-11-19 自 inknock `src/shared/ui/switch.tsx` 原樣搬入（inknock ADR 0002 D1 批）；註解中的 DESIGN.md／DECISIONS／批次指 inknock 的紀錄。
// Switch 包裝層（ADR 0001；外觀見〈外觀定案〉D3）。對外 props 不變，頁面不用改。
// 同 Button：渲染原生 <button role="switch">、只借 primitives/switch 的 class（樣式單一來源），不渲染 React Aria 的 Switch——
// React Aria 的 press 處理會擋掉 document 上「點外面就關閉」的監聽，也會改變 onClick 語意（見 button.tsx 開頭）。
//
// 停用行為沿用 2026-09-16 收斂定案：**拿掉 onClick，而不是只靠 disabled 屬性擋**（雙保險，停用態不留可疑的互動路徑）。
import { switchClassName, switchThumbClassName } from './primitives/switch'

type SwitchBase = {
  checked: boolean
  onChange: () => void
  disabled?: boolean
  /** 說明文字的 id（報讀時名稱之後接著念） */
  'aria-describedby'?: string
}
/**
 * 名稱（2026-11-20 inknock TODO ⑪）：開關一定要有固定名稱，型別層強制三選一——
 * - `aria-label`：固定名稱（旁邊的字隨狀態變時，例：營業時間給「週一營業」，不用「營業／公休」）
 * - `aria-labelledby`：指向標題（SwitchRow 用這個）
 * - `id`：給 `<label htmlFor>`（label 不能包住開關時，例如中間要放 ⓘ）；htmlFor 有沒有真的指到它，型別看不到，由消費端閘門查
 * 只靠 label 包住不算：包住的常是隨狀態變的字，名稱會跟著變（inknock 付款方式、SP 模組的開關原本完全沒有名稱）。
 */
type SwitchName =
  | { 'aria-label': string; 'aria-labelledby'?: undefined; id?: string }
  | { 'aria-labelledby': string; 'aria-label'?: undefined; id?: string }
  | { id: string; 'aria-label'?: undefined; 'aria-labelledby'?: undefined }
export type SwitchProps = SwitchBase & SwitchName

export function Switch(props: SwitchProps) {
  const { checked, onChange, disabled, id, 'aria-label': ariaLabel, 'aria-labelledby': labelledBy, 'aria-describedby': describedBy } = props
  const selected = checked || undefined
  return (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      aria-labelledby={labelledBy}
      aria-describedby={describedBy}
      disabled={disabled}
      onClick={disabled ? undefined : onChange}
      data-slot="switch"
      data-size="default"
      data-selected={selected}
      className={switchClassName}
    >
      <span data-slot="switch-thumb" data-selected={selected} className={switchThumbClassName} />
    </button>
  )
}
