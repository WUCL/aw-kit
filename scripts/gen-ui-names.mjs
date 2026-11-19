#!/usr/bin/env node
// 共用層（src/design-tokens BASE）→ src/ui/internal/token-names.generated.ts（給 src/ui/cn.ts 用）。
// 名單只取決於共用層（字級、gap／pad 別名、陰影），與品牌層無關，所以在 aw-kit 產生一份即可。
// 用法：node scripts/gen-ui-names.mjs [--check]；tests/ui/token-names.test.js 驗證已提交的檔案與產生結果相同。
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { isMain } from './is-main.mjs'
import { BASE, renderNames } from '../src/design-tokens/index.js'

export const OUT = fileURLToPath(new URL('../src/ui/internal/token-names.generated.ts', import.meta.url))
export const HEADER = [
  '// ⚠️ 產生檔，請勿手改——由 scripts/gen-ui-names.mjs 自共用層（src/design-tokens BASE）產生；改完 BASE 跑 `npm run gen:ui-names`。',
  '// 給 src/ui/cn.ts 的 createCn 用：讓 cn 認得共用層的字級與情境間距。',
]
export const expected = () => renderNames(BASE, { header: HEADER })

if (isMain(import.meta)) {
  if (process.argv.includes('--check')) {
    if (readFileSync(OUT, 'utf8') !== expected()) { console.error('❌ token-names.generated.ts 與共用層不同步：跑 npm run gen:ui-names'); process.exit(1) }
    console.log('✅ token-names.generated.ts 與共用層同步')
  } else { writeFileSync(OUT, expected()); console.log(`已產生 ${OUT}`) }
}
