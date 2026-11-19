// 2026-11-19 自 inknock `src/shared/ui/field-description.ts` 原樣搬入（inknock ADR 0002 D1 批）；註解中的 DESIGN.md／DECISIONS／批次指 inknock 的紀錄。
import { createContext, useContext } from 'react'

/**
 * FormField 交給「它的那個欄位」的錯誤／說明文字 id（2026-11-17 第 17 批）。
 * 四種欄位（Input／Select／Textarea／NumberInput，含 ComboBox 的輸入框）經 `useFieldState` 讀它，
 * 合併進 `aria-describedby`——報讀聚焦時念出錯誤原因或說明，不再只念「無效」。
 * ⚠️ 不帶「是否有錯」：曾讓 FormField 的 error 自動把欄位標紅，補審撤回——呼叫端關不掉，表單層級的錯誤（網路失敗）
 *   會把無辜的欄位標紅（lock-gate.tsx 註解明寫不可）。紅框仍由欄位自己的 `error` 決定。
 * **只套用在標籤指向的那個欄位**（元素 id＝FormField 的 htmlFor；review：children 裡的次要欄位、portal 不可誤掛）。
 * 獨立成一個檔：放在 form-field.tsx 會讓該檔同時匯出元件與 context（Fast Refresh 警告）。
 */
export type FieldContextValue = { htmlFor?: string; describedBy?: string }
export const FieldDescriptionContext = createContext<FieldContextValue | undefined>(undefined)

const NONE: { describedBy?: string } = {}

/** 元素 id 是外層 FormField 指向的那個欄位時，回傳要合併的說明 id；否則回空 */
export function useFieldContext(elementId: string | undefined): { describedBy?: string } {
  const ctx = useContext(FieldDescriptionContext)
  if (!ctx || !elementId || ctx.htmlFor !== elementId) return NONE
  return ctx
}

/** 合併呼叫端自己給的 aria-describedby 與 FormField 的說明 id（都沒有時回 undefined） */
export function joinDescribedBy(own: string | undefined, fromField: string | undefined): string | undefined {
  const ids = [own, fromField].filter(Boolean)
  return ids.length ? ids.join(' ') : undefined
}
