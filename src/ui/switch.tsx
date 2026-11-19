// 2026-11-19 自 inknock `src/shared/ui/switch.tsx` 原樣搬入（inknock ADR 0002 D1 批）；註解中的 DESIGN.md／DECISIONS／批次指 inknock 的紀錄。
// Switch 包裝層（ADR 0001；外觀見〈外觀定案〉D3）。對外 props 不變，頁面不用改。
// 同 Button：渲染原生 <button role="switch">、只借 primitives/switch 的 class（樣式單一來源），不渲染 React Aria 的 Switch——
// React Aria 的 press 處理會擋掉 document 上「點外面就關閉」的監聽，也會改變 onClick 語意（見 button.tsx 開頭）。
//
// 停用行為沿用 2026-09-16 收斂定案：**拿掉 onClick，而不是只靠 disabled 屬性擋**（雙保險，停用態不留可疑的互動路徑）。
import { switchClassName, switchThumbClassName } from './primitives/switch'

export function Switch({ checked, onChange, disabled, id }: {
  checked: boolean
  onChange: () => void
  disabled?: boolean
  /** 給 `<label htmlFor>` 用：label 不能包住開關時（例如中間要放 ⓘ）才需要 */
  id?: string
}) {
  const selected = checked || undefined
  return (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={checked}
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
