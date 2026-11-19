// 2026-11-19 自 inknock `src/shared/ui/field-state.ts` 原樣搬入（inknock ADR 0002 D3 批）；註解中的 DESIGN.md／DECISIONS／批次指 inknock 的紀錄。
import { useState, type AriaAttributes, type CSSProperties, type FocusEvent } from 'react'
import { useTheme } from './theme-context'
import { disabledFieldStyle } from './use-input-style'
import { joinDescribedBy, useFieldContext } from './field-description'

/**
 * 表單欄位的狀態回饋：Input／Select／Textarea／NumberInput 共用同一份（2026-11-04 mockup 120 code review）。
 *
 * 2026-11-13 Input／Select／Textarea 換 shadcn（ADR 0001）後分兩層：
 * - **外觀與聚焦外圈走 class**（primitives 的 inputClassName 等；NumberInput 自 2026-11-15 起也用 inputClassName）。
 * - **這裡只處理「會和呼叫端 style 打架」的那幾項**，以 inline 疊在呼叫端 style 之後：
 *   框線色（錯誤 > 聚焦 > 呼叫端原色）、停用樣式（呼叫端寫死的白底不可蓋掉停用）。
 *   inline 一定贏 class，所以呼叫端給了框色（警示黃）時，聚焦色也得在這裡算，否則聚焦時框不變色。
 *
 * 原本四個元件各複製一份「onFocus 直接改 DOM 的 borderColor、onBlur 再改回」，有兩個問題：
 * 1. 欄位還在 focus 時，錯誤或警示色一變，React 依 style 重設 borderColor，focus 色就被蓋掉。
 * 2. 呼叫端用 `border`／`background` 簡寫、元件再疊 `borderColor`／`backgroundColor` 細項：狀態解除時 React 移除細項，
 *    簡寫沒變不會重套，顏色掉回 currentColor／透明（React 也會警告這種混用）。
 * 改成：focus 由 React 狀態決定；簡寫先拆成細項；框線色永遠由這裡算。
 *
 * 呼叫端：額外的 inline 預設傳 `defaults`（Select 的箭頭）、呼叫端 style 傳 `style`，回傳的 `fieldProps` 展開在元素上（{...rest} 之後）。
 */

export function useFieldState<E extends HTMLElement>({ defaults, style, error: ownError, disabled, onFocus, onBlur, ariaInvalid, ariaDescribedBy, id }: {
  /** 元件自己的 inline 預設（外觀已在 class；目前只有 Select 的箭頭背景圖）；寫在呼叫端 style 之前 */
  defaults?: CSSProperties
  /** 呼叫端的 style（寫在 defaults 之後＝同名屬性呼叫端勝，與原本 `{ ...defaults, ...style }` 相同） */
  style?: CSSProperties
  error?: boolean
  disabled?: boolean
  onFocus?: (e: FocusEvent<E>) => void
  onBlur?: (e: FocusEvent<E>) => void
  /** 呼叫端自己給的 aria-invalid（優先於 error 推得的值） */
  ariaInvalid?: AriaAttributes['aria-invalid']
  /** 呼叫端自己給的 aria-describedby：與外層 FormField 的錯誤／說明 id 合併（fieldProps 展開在 rest 之後，不合併會被蓋掉） */
  ariaDescribedBy?: string
  /** 元素 id：與外層 FormField 的 htmlFor 相同時才接它的說明 id 與錯誤狀態 */
  id?: string
}) {
  const T = useTheme()
  const field = useFieldContext(id)
  const describedBy = joinDescribedBy(ariaDescribedBy, field.describedBy)
  const error = !!ownError
  const [focused, setFocused] = useState(false)
  // 聚焦中被設成停用：部分瀏覽器不發 blur，focused 會卡在 true，解除停用後誤顯示 focus 框（code review 2026-11-04 #1）。
  // render 階段直接校正（React 官方「依 props 調整 state」做法）。
  if (disabled && focused) setFocused(false)
  // 預設與呼叫端**各自**先拆簡寫再合併：呼叫端的 `border` 簡寫若先併進預設物件，會停在預設的（較前）位置，
  // 讓呼叫端寫在它之前的 borderColor 反而勝出（code review 2026-11-04 #5）
  const own = normalize(style)
  // 拆不開的 border（0／none）＝呼叫端自己管框線：拿掉預設的框線細項（不與簡寫並存）、不疊 focus／停用框色（第三輪 #4、第四輪 #3）
  const ownBorder = own.border !== undefined
  const base = normalize(defaults)
  if (ownBorder) { delete base.borderWidth; delete base.borderStyle; delete base.borderColor }
  const merged: CSSProperties = { ...base, ...own }
  // 聚焦框＝品牌色（同 class 的 border-ring，tailwind.css --ring＝accent600）
  const borderColor = ownBorder ? undefined : error ? T.state.danger.base : focused ? T.accent600 : merged.borderColor
  const disabledStyle = disabled ? disabledFieldStyle(T, error) : undefined
  if (disabledStyle && ownBorder) delete disabledStyle.borderColor
  return {
    /** 是否有錯（＝欄位自己的 error） */
    invalid: error,
    /** 原樣展開在元素上（放在 {...rest} 之後）：style、onFocus、onBlur、aria-invalid */
    fieldProps: {
      style: {
        ...merged,
        ...(borderColor !== undefined ? { borderColor } : {}),
        // 無框欄位也要看得到錯誤（第四輪 #1）：用內陰影畫紅框，不動呼叫端的 border
        ...(error && ownBorder ? { boxShadow: `inset 0 0 0 1px ${T.state.danger.base}` } : {}),
        ...disabledStyle,
      } as CSSProperties,
      onFocus: (e: FocusEvent<E>) => { setFocused(true); onFocus?.(e) },
      onBlur: (e: FocusEvent<E>) => { setFocused(false); onBlur?.(e) },
      'aria-invalid': ariaInvalid ?? (error ? true : undefined),
      'aria-describedby': describedBy,
    },
  }
}

/**
 * 把 `border: '1px solid #8A8A8A'` 簡寫拆成 borderWidth／borderStyle／borderColor（匯出供測試）。
 * 狀態色只改 borderColor；簡寫與細項混用時 React 移除細項會連帶清掉顏色。
 * **依屬性出現順序套用、後寫的勝出**（＝原本 CSS 的行為）：元件預設的 `border` 在前、呼叫端的 `borderColor` 在後 → 呼叫端勝。
 * `border: 0`／`'none'` 等無框寫法、看不懂的字串原樣保留，不猜（呼叫端自己管框線）。
 */
export function splitBorder(style: CSSProperties | undefined): CSSProperties {
  if (!style || typeof style.border !== 'string') return style ?? {}
  // 寬度 樣式 [顏色]（顏色可省略、可含空白如 rgb(0 0 0 / .5)）。0／none 等無框寫法不拆，交給呼叫端（見 useFieldState 的 ownBorder）
  const m = style.border.trim().match(/^(\d+(?:\.\d+)?px|thin|medium|thick)\s+(solid|dashed|dotted|double|groove|ridge|inset|outset)(?:\s+(.+))?$/)
  if (!m) return style
  const out: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(style)) {
    if (k === 'border') { out.borderWidth = m[1]; out.borderStyle = m[2]; if (m[3]) out.borderColor = m[3] }
    else out[k] = v
  }
  return out as CSSProperties
}

/**
 * 把只有顏色的 `background` 簡寫轉成 `backgroundColor`（停用樣式改的是 backgroundColor，見 disabledFieldStyle）。
 * 依屬性出現順序套用、後寫的勝出：元件預設 `backgroundColor` 在前、呼叫端 `background` 在後 → 呼叫端勝。
 * 單一值且不是圖片／漸層／`none` 的，一律當顏色（hex、rgb()、具名色、var() 等）；`'none'`、圖片、漸層、
 * 多值寫法（`#fff url(x)`、`no-repeat …`）原樣保留——`backgroundColor: 'none'` 是無效值會被瀏覽器丟掉（第三輪 #7、第四輪 #5）。
 */
function isColorOnly(v: string): boolean {
  const t = v.trim()
  if (/url\(|gradient|image-set\(|^none$/i.test(t)) return false
  return !/\s/.test(t.replace(/\([^()]*\)/g, ''))   // 括號外沒有空白＝單一值
}
export function splitBackground(style: CSSProperties): CSSProperties {
  if (typeof style.background !== 'string' || !isColorOnly(style.background)) return style
  const out: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(style)) {
    if (k === 'background') out.backgroundColor = v
    else out[k] = v
  }
  return out as CSSProperties
}

/** 先丟掉值為 undefined 的屬性（`borderColor: warn ? X : undefined` 不可蓋掉預設顏色；第四輪 #4），再拆簡寫。回傳新物件，可安全 delete。 */
function normalize(s: CSSProperties | undefined): CSSProperties {
  const defined = Object.fromEntries(Object.entries(s ?? {}).filter(([, v]) => v !== undefined)) as CSSProperties
  return { ...splitBackground(splitBorder(defined)) }
}
