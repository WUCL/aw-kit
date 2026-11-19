// 2026-11-19 自 inknock `src/shared/ui/form-field.tsx` 原樣搬入（inknock ADR 0002 D3 批）；註解中的 DESIGN.md／DECISIONS／批次指 inknock 的紀錄。
import { useId, useMemo, type CSSProperties, type ReactNode } from 'react'
import { useTheme } from './theme-context'
import { InfoTip } from './info-tip'
import { FieldDescriptionContext } from './field-description'

interface FormFieldBase {
  label?: string
  required?: boolean
  helper?: string
  error?: string
  /** 標籤列右側的小動作（例：地址旁「在地圖開啟 ↗」） */
  labelAction?: ReactNode
  /** 標籤旁的 ⓘ 說明（點開才顯示，觸控與鍵盤可用；全站唯一的說明提示，見 InfoTip） */
  labelHint?: string
  children: ReactNode
}

// htmlFor 與 group 互斥（第 13 批補審）：group 時標籤是 span、htmlFor 會被丟掉，不讓兩個同時傳
type FormFieldProps = FormFieldBase & (
  | { htmlFor?: string; group?: false }
  | {
      /** 底下是一組控制項（chip 群組、時／分兩個下拉、縣市＋區域）、沒有單一對象可 htmlFor：
       *  外層變成 role="group"、以標籤命名，標籤改用 span。單一控制項一律給 htmlFor（check:style fieldLabelFor 擋漏給）。 */
      group: true
      htmlFor?: never
    }
)

/**
 * 全站唯一的欄位標籤外觀（2026-11-16 第 13 批：原本 6 種寫法、134 處收成這一支）。
 * 12／600／inkMuted；與欄位的間距由外層容器給（`T.gap.inline`＝8，FormField 已內建）。
 * - 有對應的單一控制項 → `htmlFor`（或用 FormField）
 * - 標籤直接包住欄位（倉儲 Field 的隱式關聯）→ `as="span"`，外層 `<label>` 負責關聯
 * 必填一律傳 `required`（自動畫紅星＋報讀「必填」），不要在文字裡手寫「 *」。
 */
export function FieldLabel({ htmlFor, required, as = 'label', id, children }: {
  htmlFor?: string
  required?: boolean
  as?: 'label' | 'span'
  id?: string
  children: ReactNode
}) {
  const T = useTheme()
  const style: CSSProperties = { display: 'block', fontSize: T.fontSize.caption, fontWeight: T.fontWeight.semibold, color: T.inkMuted, fontFamily: T.font }
  const content = <>{children}{required && <RequiredMark />}</>
  return as === 'span'
    ? <span id={id} style={style}>{content}</span>
    // audit-ok: labelTarget — 共用元件轉交呼叫端給的 htmlFor，id 在呼叫端的控制項上
    : <label id={id} htmlFor={htmlFor} style={style}>{content}</label>
}

export function FormField({ label, required, helper, error, htmlFor, labelAction, labelHint, group, children }: FormFieldProps) {
  const T = useTheme()
  const labelId = useId()
  const descId = useId()
  const named = group && !!label
  // 錯誤／說明文字的 id：單一欄位經 context 交給欄位（aria-describedby），群組掛在群組上（第 17 批）
  const described = error || helper ? descId : undefined
  const fieldCtx = useMemo(() => ({ htmlFor, describedBy: described }), [htmlFor, described])

  return (
    // group 一律給 role：沒有標籤時 generic div 的 aria-describedby 報讀器不念（補審）
    <div role={group ? 'group' : undefined} aria-labelledby={named ? labelId : undefined} aria-describedby={group ? described : undefined} style={{ display: 'flex', flexDirection: 'column', gap: T.gap.inline, fontFamily: T.font }}>
      {label && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: T.gap.inline }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: T.spacing.xs }}>
        <FieldLabel htmlFor={htmlFor} required={required} as={group ? 'span' : 'label'} id={named ? labelId : undefined}>{label}</FieldLabel>
        {labelHint && <InfoTip text={labelHint} label={label} />}
        </span>
        {labelAction}
        </div>
      )}
      <FieldDescriptionContext.Provider value={group ? undefined : fieldCtx}>{children}</FieldDescriptionContext.Provider>
      {error ? (
        // 不用 role=alert（補審撤回）：逐字驗證的欄位會邊打邊插話、送出時多欄同時搶播、說明換成錯誤時重用節點反而不念。
        // 錯誤原因由 aria-describedby 在聚焦時念；送出後的整體提示由表單統一給一處（例：申請頁的摘要）
        <span id={descId} style={{ fontSize: T.fontSize.caption, color: T.state.danger.dark, lineHeight: T.lineHeight.body }}>{error}</span>
      ) : helper ? (
        <span id={descId} style={{ fontSize: T.fontSize.caption, color: T.inkFaint, lineHeight: T.lineHeight.body }}>{helper}</span>
      ) : null}
    </div>
  )
}

/** 必填紅星——FormField 與各區域欄位元件共用，規則見 DESIGN.md FormField §必填／選填標示。
 *  星號本身對報讀軟體隱藏（只會念「星號」），改由視覺隱藏的「必填」進入 label 的可及名稱。 */
export function RequiredMark() {
  const T = useTheme()
  return (
    <>
      <span aria-hidden="true" style={{ color: T.state.danger.dark, marginLeft: T.spacing.xs }}>*</span>
      <span style={SR_ONLY}>（必填）</span>
    </>
  )
}

const SR_ONLY: CSSProperties = {
  position: 'absolute', width: 1, height: 1, padding: 0, margin: -1,
  overflow: 'hidden', clip: 'rect(0 0 0 0)', whiteSpace: 'nowrap', border: 0,
}
