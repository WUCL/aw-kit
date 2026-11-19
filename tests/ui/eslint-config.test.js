// @vitest-environment node
// aw-kit/ui lint（eslint.config.js）的固定負例清單：讀真實設定檔跑 lintText。
// files glob 漏掉某類檔案、selector 改壞、flat config 同名 rule 互相取代、或之後有人替某檔加整檔排除，這裡都會紅。
// IME 清單照搬 inknock tests/eslint-ime-rule.test.ts（selector 是同一份 src/eslint-rules/selectors.js）。
import { fileURLToPath } from 'node:url'
import { ESLint } from 'eslint'
import { describe, expect, it } from 'vitest'

const ROOT = fileURLToPath(new URL('../..', import.meta.url))
const eslint = new ESLint({ cwd: ROOT })
async function hits(code, file, ruleId, needle = '') {
  const [r] = await eslint.lintText(code, { filePath: `${ROOT}${file}` })
  return r.messages.filter(m => m.ruleId === ruleId && m.message.includes(needle)).length
}
const SYNTAX = 'no-restricted-syntax'
const FILES = ['src/ui/zz-probe.ts', 'src/ui/zz-probe.tsx', 'src/ui/primitives/zz-probe.tsx', 'src/ui/internal/zz-probe.ts', 'src/ui/submit-enter.ts']

const IME_NEGATIVES = [
  ['e.key === Enter', "export const f = (e: { key: string }) => e.key === 'Enter'"],
  ['e.key !== Escape', "export const f = (e: { key: string }) => e.key !== 'Escape'"],
  ['== 寬鬆比較', "export const f = (e: { key: string }) => e.key == 'Enter'"],
  ['兩邊對調（Yoda）', "export const f = (e: { key: string }) => 'Enter' === e.key"],
  ["方括號 e['key']", "export const f = (e: { key: string }) => e['key'] === 'Escape'"],
  ['switch case', "export const f = (e: { key: string }) => { switch (e.key) { case 'Enter': return 1 } return 0 }"],
  ['陣列 includes', "export const f = (e: { key: string }) => ['Enter', 'Tab'].includes(e.key)"],
  ['可選串連 e?.key', "export const f = (e?: { key: string }) => e?.key === 'Enter'"],
  ['可選串連 switch', "export const f = (e?: { key: string }) => { switch (e?.key) { case 'Escape': return 1 } return 0 }"],
  ['e.code', "export const f = (e: { code: string }) => e.code === 'Enter'"],
]
const IME_POSITIVES = [
  ['其他按鍵', "export const f = (e: { key: string }) => e.key === 'ArrowDown'"],
  ['includes 其他按鍵', "export const f = (e: { key: string }) => ['ArrowUp', 'ArrowDown'].includes(e.key)"],
  ['方括號變數 o[key]（不是鍵盤事件）', "export const f = (o: Record<string, string>, key: string) => o[key] === 'Escape'"],
]

describe('aw-kit/ui lint：中文輸入法 Enter／Esc', () => {
  for (const file of FILES) {
    for (const [name, code] of IME_NEGATIVES) {
      it(`${file}：${name} 要報錯（submit-enter.ts 也不整檔排除，只靠逐行具名 disable）`, async () => {
        expect(await hits(code, file, SYNTAX, 'isSubmitEnter')).toBeGreaterThan(0)
      })
    }
    for (const [name, code] of IME_POSITIVES) {
      it(`${file}：${name} 不報`, async () => { expect(await hits(code, file, SYNTAX, 'isSubmitEnter')).toBe(0) })
    }
  }
  it('測試檔會構造 Enter 事件，不套 IME 規則', async () => {
    expect(await hits("export const f = (e: { key: string }) => e.key === 'Enter'", 'tests/ui/zz.test.ts', SYNTAX)).toBe(0)
  })
})

describe('aw-kit/ui lint：從 inknock 帶過來的其他規則', () => {
  const f = 'src/ui/primitives/zz-probe.tsx'
  it.each([
    ['原生 window.confirm', 'export const g = () => window.confirm("x")', SYNTAX],
    ['原生 alert()', 'export const g = () => alert("x")', SYNTAX],
    ['toISOString 取日期', 'export const g = () => new Date().toISOString().slice(0, 10)', SYNTAX],
    ['toISOString split T', "export const g = () => new Date().toISOString().split('T')", SYNTAX],
    ['inputMode="numeric"', 'export const G = () => <input inputMode="numeric" />', SYNTAX],
    ['type="number"', 'export const G = () => <input type="number" />', SYNTAX],
    ['JSX 裡沒包 {} 的註解', 'export const G = () => <div>// 說明</div>', 'react/jsx-no-comment-textnodes'],
    ['註解裡的全形空格（U+3000）', 'export const g = 1 // 說明　文字', 'no-irregular-whitespace'],
    ['裸 cn（套件預設版）', "import { cn } from 'cn'\nexport const g = cn('a')", '@typescript-eslint/no-restricted-imports'],
    ['裸 cn re-export', "export { cn } from 'cn'", '@typescript-eslint/no-restricted-imports'],
    ['裸 cn export *', "export * from 'cn'", '@typescript-eslint/no-restricted-imports'],
    ['@supabase 值 import', "import { createClient } from '@supabase/supabase-js'\nexport const c = createClient('u', 'k')", '@typescript-eslint/no-restricted-imports'],
    ['條件式呼叫 hook', "import { useState } from 'react'\nexport function useX(c: boolean) { if (c) useState(0) }", 'react-hooks/rules-of-hooks'],
    ['元件裡定義元件', 'export function A() { const B = () => <i />; return <B /> }', 'react-hooks/static-components'],
    ['寫死字級（aw-kit 代幣規則）', 'export const G = () => <p style={{ fontSize: 13 }} />', 'aw-kit/no-hardcoded-design-token'],
  ])('%s 要報錯', async (_, code, rule) => {
    expect(await hits(code, f, rule)).toBeGreaterThan(0)
  })
  it.each([
    ['cn/config 子路徑', "import { createCn } from 'cn/config'\nexport const c = createCn()"],
    ['@supabase import type', "import type { SupabaseClient } from '@supabase/supabase-js'\nexport type C = SupabaseClient"],
    ['字串裡的全形空格', "export const g = '說明　文字'"],
  ])('%s 不報', async (_, code) => {
    const [r] = await eslint.lintText(code, { filePath: `${ROOT}${f}` })
    expect(r.messages.filter(m => m.severity === 2)).toEqual([])
  })
})
