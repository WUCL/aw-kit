// ⚠️ 產生檔，請勿手改——由 scripts/gen-ui-names.mjs 自共用層（src/design-tokens BASE）產生；改完 BASE 跑 `npm run gen:ui-names`。
// 給 src/ui/cn.ts 的 createCn 用：讓 cn 認得共用層的字級與情境間距。
export const TEXT_SIZES = ['caption', 'meta', 'body', 'body-lg', 'title', 'page-title', 'amount', 'kpi', 'xs', 'sm', 'base'] as const
export const SPACING_ALIASES = ['hairline', 'icon', 'inline', 'stack', 'field', 'block', 'section', 'control', 'row-y', 'input-y', 'input-x', 'card', 'panel', 'panel-mobile', 'page'] as const
export const SHADOWS = ['knob'] as const
