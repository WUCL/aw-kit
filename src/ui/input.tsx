// 2026-11-19 自 inknock `src/shared/ui/input.tsx` 原樣搬入（inknock ADR 0002 D3 批）；註解中的 DESIGN.md／DECISIONS／批次指 inknock 的紀錄。
// Input 包裝層（ADR 0001；2026-11-13 換 shadcn）。對外 props 不變，頁面不用改。
// 同 Button：渲染原生 <input>、只借 primitives/input 的 inputClassName（樣式單一來源），不渲染 React Aria 的 Input。
// 與呼叫端 style 會打架的狀態（框線色、停用）仍由 useFieldState 以 inline 疊上，見 field-state.ts。
import { forwardRef, type ChangeEvent, type CompositionEvent, type InputHTMLAttributes, type ReactNode } from 'react'
import { useFieldState } from './field-state'
import { inputClassName } from './primitives/input'
import { cn } from './cn'
import { sanitizeNumber, type NumberKind } from './sanitize-number'
import { useTrailingDot } from './use-trailing-dot'

type InputSize = 'sm' | 'md' | 'lg'

// className 不開放（同 Button）：外觀由本元件決定；原本有人疊 focus-ring，換新後聚焦外圈已內建，疊上會變兩圈
interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size' | 'className'> {
  inputSize?: InputSize
  error?: boolean
  fullWidth?: boolean
  leftIcon?: ReactNode
  rightIcon?: ReactNode
  /**
   * 數字欄（2026-09-29）：設了就套用與 `<NumberInput>` 同一支 `sanitizeNumber`（全形轉半形、濾非數字），
   * 並自動給 `inputMode`。要 Input 的外觀（尺寸／錯誤框／左右圖示）又要數字清洗時用這個；
   * 其餘數字欄用 `<NumberInput>`。兩者共用同一份清洗，全站只有一套規則。
   */
  numberKind?: NumberKind
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  {
    inputSize = 'md', error = false, fullWidth = true, leftIcon, rightIcon, style,
    // 後台欄位一律預設關閉瀏覽器自動填入／儲存提示。全站只有登入頁該讓瀏覽器
    // 存取帳密，而兩個登入頁都用裸 <input>、不走這裡，所以預設 off 是安全的。
    // 呼叫端仍可明寫 autoComplete 覆寫（例：真的想讓瀏覽器記住的欄位）。
    autoComplete = 'off',
    numberKind,
    ...rest
  },
  ref,
) {
  // numberKind="integer" 的結尾小數點回顯（見 use-trailing-dot.ts）；非 integer 時原樣回傳 value
  const { display: dotValue, remember } = useTrailingDot(rest.value, numberKind)

  // 狀態回饋（框線色／停用＋aria-invalid）四種欄位共用同一份，見 field-state.ts
  const fs = useFieldState<HTMLInputElement>({
    style, error, disabled: rest.disabled, onFocus: rest.onFocus, onBlur: rest.onBlur, ariaInvalid: rest['aria-invalid'], ariaDescribedBy: rest['aria-describedby'], id: rest.id,
  })

  const inputEl = (
    <input
      {...rest}
      {...(numberKind ? {
        inputMode: numberKind === 'decimal' ? 'decimal' as const : 'numeric' as const,
        // 先把 DOM 值換成清洗後的字串再交給呼叫端：受控欄位由呼叫端 state 接手，非受控（defaultValue）也一樣乾淨
        onChange: (e: ChangeEvent<HTMLInputElement>) => {
          // 輸入法組字中**完全不通知呼叫端**（原始值交出去會被呼叫端自己的清洗吃掉或算錯；code review 2026-09-30），
          // 組字結束（onCompositionEnd）清洗後才通知一次
          if ((e.nativeEvent as InputEvent).isComposing) return
          const v = sanitizeNumber(e.target.value, numberKind)
          if (v !== e.target.value) e.target.value = v
          remember(v)
          rest.onChange?.(e)
        },
        onCompositionEnd: (e: CompositionEvent<HTMLInputElement>) => {
          rest.onCompositionEnd?.(e)
          const el = e.currentTarget
          el.value = sanitizeNumber(el.value, numberKind)
          remember(el.value)
          // 直接以同一個 input 當 target 通知呼叫端（呼叫端只讀 e.target.value）；
          // 不用「原生 setter＋派發 input 事件」——值與 React 記錄的相同時 React 不會觸發 onChange，呼叫端會漏掉這次輸入
          rest.onChange?.({ ...e, target: el, currentTarget: el } as unknown as ChangeEvent<HTMLInputElement>)
        },
      } : {})}
      {...(rest.value !== undefined ? { value: dotValue } : {})}
      autoComplete={autoComplete}
      ref={ref}
      data-slot="input"
      // 高度與 Button 同一套（sm 28／md 32／lg 36，桌機手機相同）；字級 15，手機由 index.css 升 16 防 iOS 聚焦放大
      className={cn(
        inputClassName,
        // 上游 min-w-0 讓欄位在 flex 列裡可壓到 0；原本的 inline 版是瀏覽器預設（不會壓過內容寬），
        // 工具列、表格列都照那個排過，換外觀不換排版
        'min-w-auto',
        inputSize === 'sm' && 'h-(--control-h-sm)',
        inputSize === 'lg' && 'h-(--control-h-lg)',
        !fullWidth && 'w-auto',
        leftIcon && 'pl-8',
        rightIcon && 'pr-8',
      )}
      {...fs.fieldProps}
    />
  )

  if (!leftIcon && !rightIcon) return inputEl

  // 圖示距邊 10（同 px-2.5）、文字從 32 起（同 shadcn InputGroup）；右側圖示可點（顯示密碼鈕），左側不可
  return (
    <div data-slot="input-icon-wrapper" className={cn('relative', fullWidth && 'w-full')}>
      {leftIcon && (
        <span className="pointer-events-none absolute top-1/2 left-2.5 flex -translate-y-1/2 items-center text-muted-foreground">
          {leftIcon}
        </span>
      )}
      {inputEl}
      {rightIcon && (
        <span className="absolute top-1/2 right-2.5 flex -translate-y-1/2 items-center text-muted-foreground">
          {rightIcon}
        </span>
      )}
    </div>
  )
})
