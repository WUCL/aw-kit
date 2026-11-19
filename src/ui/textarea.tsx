// 2026-11-19 自 inknock `src/shared/ui/textarea.tsx` 原樣搬入（inknock ADR 0002 D3 批）；註解中的 DESIGN.md／DECISIONS／批次指 inknock 的紀錄。
// Textarea 包裝層（ADR 0001；2026-11-13 換 shadcn）。對外 props 不變，頁面不用改。
// 同 Button／Input：渲染原生 <textarea>、只借 primitives/textarea 的 textareaClassName（樣式單一來源）。
// 初始高度由 rows 決定（預設 3）、最小 64；上游的 field-sizing-content（隨內容長高）已在 primitives 拿掉，理由見該檔。
// 與呼叫端 style 會打架的狀態（框線色、停用）仍由 useFieldState 以 inline 疊上，見 field-state.ts。
import { forwardRef, type TextareaHTMLAttributes } from 'react'
import { useFieldState } from './field-state'
import { textareaClassName } from './primitives/textarea'
import { cn } from './cn'

// className 不開放（同 Button）
interface TextareaProps extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'className'> {
  error?: boolean
  fullWidth?: boolean
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { error = false, fullWidth = true, style, rows = 3, ...rest },
  ref,
) {
  // 狀態回饋（框線色／停用＋aria-invalid）四種欄位共用同一份，見 field-state.ts
  const fs = useFieldState<HTMLTextAreaElement>({
    style, error, disabled: rest.disabled, onFocus: rest.onFocus, onBlur: rest.onBlur, ariaInvalid: rest['aria-invalid'], ariaDescribedBy: rest['aria-describedby'], id: rest.id,
  })

  return (
    <textarea
      {...rest}
      ref={ref}
      rows={rows}
      data-slot="textarea"
      // 只准上下拉（原本就是）；上游未設＝瀏覽器預設可左右拉，會撐破面板
      className={cn(textareaClassName, 'resize-y', !fullWidth && 'w-auto')}
      {...fs.fieldProps}
    />
  )
})
