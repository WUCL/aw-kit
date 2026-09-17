// 套件入口：flat-config plugin 物件。用真正的 Linter 跑 recommended config，證明三條規則
// 都接得上（而不是只測各規則的 create）。
import { describe, it, expect } from 'vitest'
import { Linter } from 'eslint'
import tsParser from '@typescript-eslint/parser'
import plugin, { rules, recommended } from '../../src/eslint-rules/index.js'

const linter = new Linter({ configType: 'flat' })
const lint = (code, extra = {}) =>
  linter.verify(code, [
    { files: ['**/*.tsx'], languageOptions: { parser: tsParser, ecmaVersion: 'latest', sourceType: 'module', parserOptions: { ecmaFeatures: { jsx: true } } } },
    recommended,
    extra,
  ], { filename: 'x.tsx' })

describe('aw-kit/eslint-rules', () => {
  it('plugin 物件形狀：meta.name、rules 三條、configs.recommended', () => {
    expect(plugin.meta.name).toBe('aw-kit')
    expect(Object.keys(rules).sort()).toEqual(['no-hardcoded-design-token', 'no-inline-date-format', 'verified-supabase-write'])
    expect(plugin.configs.recommended).toBe(recommended)
    expect(recommended.plugins['aw-kit']).toBe(plugin)
  })

  it('recommended 三條都是 error，且分別會亮', () => {
    const msgs = lint(`
      await supabase.from('t').update({ a: 1 }).eq('id', id)
      const s = { fontSize: 14 }
      const d = new Date()
      const y = \`\${d.getFullYear()}-\${String(d.getMonth() + 1).padStart(2, '0')}\`
    `)
    expect(msgs.map(m => [m.ruleId, m.severity])).toEqual([
      ['aw-kit/verified-supabase-write', 2],
      ['aw-kit/no-hardcoded-design-token', 2],
      ['aw-kit/no-inline-date-format', 2],
    ])
  })

  it('乾淨的程式碼零訊息', () => {
    expect(lint("await verifyWrite(supabase.from('t').update({ a: 1 }).eq('id', id), 'x'); const s = { fontSize: T.fontSize.md }")).toEqual([])
  })

  it('消費端可覆蓋 options', () => {
    const msgs = lint("await ensureRows(db.from('t').update({ a: 1 }).eq('id', id))", {
      rules: { 'aw-kit/verified-supabase-write': ['error', { clientNames: ['db'], verifyFnName: 'ensureRows' }] },
    })
    expect(msgs).toEqual([])
  })
})
