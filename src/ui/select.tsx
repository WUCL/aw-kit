// 2026-11-19 自 inknock `src/shared/ui/select.tsx` 原樣搬入（inknock ADR 0002 D3 批）；註解中的 DESIGN.md／DECISIONS／批次指 inknock 的紀錄。
// Select 包裝層（ADR 0001；2026-11-13 換 shadcn native-select）。對外 props 不變，頁面不用改。
// 同 Button／Input：渲染原生 <select>、只借 primitives/native-select 的 nativeSelectClassName（樣式單一來源）。
//
// ⚠️ 刻意不照上游包一層 <div> 放 lucide 箭頭元件：呼叫端的 style（flex: 1、flexShrink: 0、width、marginLeft…約 20 處）
//   是寫給 <select> 的，多一層 div 後它們會落在錯的元素上、版面跑掉。箭頭改用 inline 背景圖畫**同一個** lucide
//   chevron-down（同路徑、16px、線寬 2、距右 10、色 muted-foreground；停用時 ink-faint），<select> 仍是唯一的根元素。
// 與呼叫端 style 會打架的狀態（框線色、停用）仍由 useFieldState 以 inline 疊上，見 field-state.ts。
import { forwardRef, type SelectHTMLAttributes } from 'react'
import { useTheme } from './theme-context'
import { useFieldState } from './field-state'
import { nativeSelectClassName } from './primitives/native-select'
import { cn } from './cn'

type SelectSize = 'sm' | 'md' | 'lg'

// className 不開放（同 Button）：原本有人疊 focus-ring，換新後聚焦外圈已內建，疊上會變兩圈
interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'size' | 'className'> {
  selectSize?: SelectSize
  error?: boolean
  fullWidth?: boolean
}

/** lucide chevron-down（lucide-react ChevronDownIcon 同一條路徑）畫成背景圖 */
const chevron = (color: string) =>
  `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='${encodeURIComponent(color)}' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><path d='m6 9 6 6 6-6'/></svg>")`

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { selectSize = 'md', error = false, fullWidth = true, style, children, ...rest },
  ref,
) {
  const T = useTheme()

  // 狀態回饋（框線色／停用＋aria-invalid）四種欄位共用同一份，見 field-state.ts
  const fs = useFieldState<HTMLSelectElement>({
    defaults: {
      backgroundImage: chevron(rest.disabled ? T.inkFaint : T.inkMuted),
      backgroundRepeat: 'no-repeat',
      backgroundPosition: 'right 10px center',
      backgroundSize: '16px 16px',
    },
    style, error, disabled: rest.disabled, onFocus: rest.onFocus, onBlur: rest.onBlur, ariaInvalid: rest['aria-invalid'], ariaDescribedBy: rest['aria-describedby'], id: rest.id,
  })

  return (
    <select
      {...rest}
      ref={ref}
      data-slot="native-select"
      // 高度與 Button／Input 同一套（sm 28／md 32／lg 36）；sm 走上游的 data-[size=sm]
      data-size={selectSize === 'sm' ? 'sm' : 'default'}
      className={cn(
        nativeSelectClassName,
        // 同 Input：上游 min-w-0 會讓下拉在 flex 工具列裡被擠到看不見字（比較頁實測 130→83），維持原本瀏覽器預設
        'min-w-auto',
        selectSize === 'lg' && 'h-(--control-h-lg)',
        !fullWidth && 'w-auto',
        !rest.disabled && 'cursor-pointer',
      )}
      {...fs.fieldProps}
    >
      {children}
    </select>
  )
})
