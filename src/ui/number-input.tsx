// 2026-11-19 自 inknock `src/shared/ui/number-input.tsx` 原樣搬入（inknock ADR 0002 D3 批）；註解中的 DESIGN.md／DECISIONS／批次指 inknock 的紀錄。
import { forwardRef, useId, type InputHTMLAttributes, type KeyboardEvent, type ReactNode } from 'react'
import { MinusIcon, PlusIcon } from 'lucide-react'
import { sanitizeNumber, type NumberKind } from './sanitize-number'
import { useTrailingDot } from './use-trailing-dot'
import { useFieldState } from './field-state'
import { inputClassName } from './primitives/input'
import { cn } from './cn'
import { numberGroupClassName, numberGroupInputClassName, numberStepClassName, numberSuffixClassName } from './primitives/number-field'
import { isImeComposing } from './submit-enter'

/**
 * 全站唯一的數字輸入框（2026-09-29，DECISIONS 同日；對標 Shopify Polaris TextField）。
 *
 * 為什麼是元件而不是函式：`digitsOnly` 早就存在，38 個數字欄卻只有 3 個檔案在用——
 * 「有函式可用」不等於「每個人都記得用」。清洗放進元件，呼叫端就忘不掉；
 * ESLint 另擋原生 `inputMode="decimal|numeric"`／`type="number"`（見 eslint.config.js）。
 *
 * - integer 的值可能以 `.` 結尾（逐鍵打字用，見 sanitizeNumber）；呼叫端若把值轉數字再回灌，點由 useTrailingDot 補回顯示。
 * - `kind`：`decimal`（金額，可小數）／`integer`（數量、次數）／`digits`（末五碼、電話，保留前導 0）
 * - `value`／`onChange` 一律是**字串**：空字串＝沒填（本專案的既有哨兵），呼叫端自己 `Number()`。
 * - 外觀與 Input 同一套（2026-11-15 ADR 0001 數字欄批次）：框、圓角、白底、字級、內距、聚焦外圈都由本元件給，**一律等寬數字**；
 *   呼叫端的 `style` 只放排版（寬度、flex）。尺寸 `inputSize`（md 32 預設／sm 28 表格內嵌）、對齊 `align`（start 預設／end／center）。
 *   在這之前本元件不帶外觀，30 處呼叫端各畫一份（字重 400／600／700、三種對齊、五種內距）。
 * - 但**狀態回饋與 Input 同一套**（2026-11-04 mockup 120；2026-11-13 隨 Input 換 shadcn）：聚焦框線品牌色＋3px 淡外圈、
 *   `disabled` 套 disabledFieldStyle、`error` 紅框（danger.base）＋淡紅外圈＋aria-invalid（錯誤中聚焦外圈改品牌色）。錯誤一律用 `error`，不要在 style 裡自己切紅框——原本 6 處各自畫、用了三種紅。
 *   狀態邏輯與 Input／Select／Textarea 共用 `useFieldState`（field-state.ts）。
 * - 後綴與步進鈕（2026-11-15 ADR 0001 D5）：`suffix`（例：「%」）、`stepper`（−／＋，**只給百分比、份數這類小範圍數值**；金額不帶）。
 *   有其中之一時，外框改畫在外層（`primitives/number-field.tsx`，與一般欄位同一組外觀），**`style` 套在外框上**（排版與警示色；
 *   框線色、停用樣式照一般欄位的優先序：錯誤 > 聚焦 > 呼叫端色，同一份 useFieldState）。
 *   −／＋ 不進 Tab 順序（鍵盤用 ↑↓，組字中不動）；到上下限就停用。**上下限只管 −／＋ 與 ↑↓，手打的值不改寫**——由呼叫端決定
 *   （補審：失焦自動夾回會把結帳數量打 0 悄悄存成 1、Tab 經過就改寫載入的舊值、失焦存檔的呼叫端存到夾回前的值；改設計拿掉）。
 *   沒給 min 且不允許負數時，下限是 0（否則在 0 按 − 會得到 -1、被清洗成 1，數字反而變大）。
 */
// className 不開放（同 Input）：聚焦外圈已內建，再疊 focus-ring 會變兩圈（2026-11-13 review：LineItemEditor 單價欄）
type Props = Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange' | 'type' | 'inputMode' | 'className'> & {
  value: string | number
  onChange: (value: string) => void
  kind?: NumberKind
  allowNegative?: boolean
  /** 錯誤紅框（與 Input 的 `error` 同色）；錯誤訊息文字由外層 FormField 或呼叫端顯示 */
  error?: boolean
  /** md 32（預設，表單）／sm 28（表格、列內嵌），與 Input 同一套 */
  inputSize?: 'sm' | 'md'
  /** 文字對齊：start（預設，表單裡與其他欄位一致）／end（列內的數字，對齊個位數）／center */
  align?: 'start' | 'center' | 'end'
  /** 框內的後綴（例：「%」） */
  suffix?: ReactNode
  /** −／＋ 步進鈕（小範圍數值才給）；min／max 到了就停用，step 預設 1 */
  stepper?: { min?: number; max?: number; step?: number }
}

export const NumberInput = forwardRef<HTMLInputElement, Props>(function NumberInput(
  { value, onChange, kind = 'decimal', allowNegative = false, error = false, inputSize = 'md', align = 'start', suffix, stepper, style, onFocus, onBlur, onKeyDown, ...rest }, ref,
) {
  const grouped = suffix !== undefined || stepper !== undefined
  const { display, remember } = useTrailingDot(value, kind)
  const emit = (raw: string) => { const v = sanitizeNumber(raw, kind, allowNegative); remember(v); onChange(v) }

  const num = Number(String(value).replace(/,/g, ''))
  const cur = Number.isFinite(num) && String(value).trim() !== '' ? num : null
  const step = stepper?.step ?? 1
  const min = stepper ? (stepper.min ?? (allowNegative ? undefined : 0)) : undefined
  const max = stepper?.max
  const inRange = (n: number) => (min === undefined || n >= min) && (max === undefined || n <= max)
  // 不在步距格點上（0.5、step 1）也能按到上下限：判斷「還沒到」就好，最後一步由 clamp 收
  const canDown = !rest.disabled && !rest.readOnly && (min === undefined || cur === null || cur > min)
  const canUp = !rest.disabled && !rest.readOnly && (max === undefined || cur === null || cur < max)
  const clamp = (n: number) => Math.min(max ?? Infinity, Math.max(min ?? -Infinity, n))
  // 小數位數取 step 與使用者實際打的字（不是 Number 後的值）較多者：0.15 ＋0.1＝0.25、1.50 ＋1＝2.50
  const typedDp = (String(value).split('.')[1] ?? '').length
  const fmt = (n: number) => { const dp = Math.max((String(step).split('.')[1] ?? '').length, typedDp); return dp ? n.toFixed(dp) : String(n) }
  const bump = (dir: 1 | -1) => {
    // 空白時：按 ＋ 從下限（沒有就 0）開始、按 − 不動
    const base = cur ?? (dir > 0 ? (min ?? 0) - step : null)
    if (base === null) return
    emit(fmt(clamp(base + dir * step)))
  }
  // 狀態回饋（focus／停用／錯誤）與 Input／Select／Textarea 共用同一份，見 field-state.ts。
  // 有外框時：算出來的 style（呼叫端排版＋框線色優先序＋停用）給外框，欄位只拿 focus／blur／aria-invalid
  const fs = useFieldState<HTMLInputElement>({ style, error, disabled: rest.disabled, onFocus, onBlur, ariaInvalid: rest['aria-invalid'], ariaDescribedBy: rest['aria-describedby'], id: rest.id })
  const { style: computedStyle, ...fieldHandlers } = fs.fieldProps
  // 唯讀：聚焦不換品牌色框（inline 會蓋過 class 的 data-readonly 規則；補審）——退回呼叫端給的框色或 class 預設
  const fieldStyle = rest.readOnly && !fs.invalid && !rest.disabled ? { ...computedStyle, borderColor: style?.borderColor } : computedStyle
  const ownId = useId()
  const inputId = rest.id ?? ownId
  const keyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    onKeyDown?.(e)
    if (!stepper || e.defaultPrevented || isImeComposing(e)) return
    if (e.key === 'ArrowUp' && canUp) { e.preventDefault(); bump(1) }
    else if (e.key === 'ArrowDown' && canDown) { e.preventDefault(); bump(-1) }
  }

  const input = (
    <input
      ref={ref}
      type="text"
      inputMode={kind === 'decimal' ? 'decimal' : 'numeric'}
      autoComplete="off"
      // 放在 {...rest} 之前：呼叫端要覆寫 role／aria-value* 可以；超出範圍的暫時值（打字中的 0）不回報給輔助技術
      {...(stepper ? { role: 'spinbutton', 'aria-valuenow': cur !== null && inRange(cur) ? cur : undefined, 'aria-valuemin': min, 'aria-valuemax': max } : {})}
      {...rest}
      id={grouped ? inputId : rest.id}
      value={display}
      // 注音等輸入法組字中**完全不通知呼叫端**：組字中的原始值（「ㄅ」、全形、帶點）若交出去，
      // 呼叫端自己的清洗或 Number() 會把它吃掉／算錯，受控欄位也會在組字途中被重設（code review 2026-09-30）。
      // 組字結束才清洗、通知一次。
      onChange={e => { if (!(e.nativeEvent as InputEvent).isComposing) emit(e.target.value) }}
      onCompositionEnd={e => { rest.onCompositionEnd?.(e); emit(e.currentTarget.value) }}
      onKeyDown={keyDown}
      data-slot="input"
      className={grouped ? cn(
        numberGroupInputClassName,
        align === 'end' && 'text-right',
        align === 'center' && 'text-center',
        suffix !== undefined && 'pr-0',
      ) : cn(
        inputClassName,
        // 同 Input：不壓過內容寬（上游 min-w-0）
        'min-w-auto tabular-nums',
        // 字重固定 400：scoped preflight 是 font: inherit，放在加粗的表格格／標籤裡會跟著變粗（review）
        'font-normal',
        inputSize === 'sm' && 'h-(--control-h-sm)',
        align === 'end' && 'text-right',
        align === 'center' && 'text-center',
      )}
      {...(grouped ? fieldHandlers : fs.fieldProps)}
    />
  )
  if (!grouped) return input

  // 名稱：欄位有 aria-label 就接上（「增加數量」）；用 <label htmlFor> 命名的欄位拿不到文字，至少以 aria-controls 指回欄位
  const label = rest['aria-label'] ?? ''
  const stepBtn = (dir: 1 | -1) => (
    <button
      // audit-ok: bareControl — 數字欄框內的 −／＋（框的一部分），不是獨立按鈕
      type="button"
      tabIndex={-1}
      aria-label={`${dir > 0 ? '增加' : '減少'}${label}`}
      aria-controls={inputId}
      disabled={dir > 0 ? !canUp : !canDown}
      // 不讓按鈕搶走欄位焦點（iPad 連點時鍵盤不會收起再彈出）
      onMouseDown={e => e.preventDefault()}
      onClick={() => bump(dir)}
      className={cn(numberStepClassName, inputSize === 'sm' && 'w-(--control-h-sm)')}
    >
      {dir > 0 ? <PlusIcon aria-hidden="true" /> : <MinusIcon aria-hidden="true" />}
    </button>
  )
  return (
    <div
      data-slot="number-field"
      data-invalid={fs.invalid || undefined}
      data-disabled={rest.disabled || undefined}
      data-readonly={(rest.readOnly && !rest.disabled) || undefined}
      className={cn(numberGroupClassName, inputSize === 'sm' && 'h-(--control-h-sm)')}
      style={fieldStyle}
    >
      {stepper && stepBtn(-1)}
      {input}
      {suffix !== undefined && <span aria-hidden="true" className={numberSuffixClassName}>{suffix}</span>}
      {stepper && stepBtn(1)}
    </div>
  )
})

