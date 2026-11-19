// aw-kit/ui 的 cn（2026-11-19 自 inknock `src/shared/ui/cn.ts` 搬入，inknock ADR 0002 C 批）。
// primitives 以相對路徑 `../cn` 引用本檔（inknock 原本靠 vite／tsconfig 的 `cn` 別名，搬進來後不再需要）。
//
// 為什麼要自訂：預設 cn 不認得共用層的字級（text-meta…）與情境間距（p-card…），
// 會把 text-meta 當成文字顏色——`cn('text-meta', 'text-ink-muted')` 只剩後者，字級靜默消失。
// 陰影同理：shadow-knob 不註冊會被當成陰影顏色。
// 名單由共用層（design-tokens 的 BASE）產生，見 internal/token-names.generated.ts。
import { createCn } from 'cn/config'
import { SHADOWS, SPACING_ALIASES, TEXT_SIZES } from './internal/token-names.generated'

export const cn = createCn({
  extend: {
    classGroups: { 'font-size': [{ text: [...TEXT_SIZES] }] },
    theme: { spacing: [...SPACING_ALIASES], shadow: [...SHADOWS] },
  },
})
