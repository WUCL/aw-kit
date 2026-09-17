// aw-kit/eslint-rules — flat-config ESLint plugin. Plain Node ESM, no build step.
//
//   import awKit from 'aw-kit/eslint-rules'
//   export default [ ..., awKit.configs.recommended ]
//
// recommended 三條全部 error（starter 是新專案；有存量的專案自己降 warn）。
// 各規則的理由與已知限制寫在各自檔頭。
import verifiedSupabaseWrite from './verified-supabase-write.js'
import noHardcodedDesignToken from './no-hardcoded-design-token.js'
import noInlineDateFormat from './no-inline-date-format.js'

export const rules = {
  'verified-supabase-write': verifiedSupabaseWrite,
  'no-hardcoded-design-token': noHardcodedDesignToken,
  'no-inline-date-format': noInlineDateFormat,
}

const plugin = {
  meta: { name: 'aw-kit', version: '0.2.1' },
  rules,
  configs: {},
}

export const recommended = {
  name: 'aw-kit/recommended',
  plugins: { 'aw-kit': plugin },
  rules: {
    'aw-kit/verified-supabase-write': 'error',
    'aw-kit/no-hardcoded-design-token': 'error',
    'aw-kit/no-inline-date-format': 'error',
  },
}
plugin.configs.recommended = recommended

export default plugin
