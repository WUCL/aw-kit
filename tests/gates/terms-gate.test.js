// @vitest-environment node
// terms-gate 的鑑別力：用詞表裡的詞要紅，乾淨寫法與註解要綠。2026-11-19 自 inknock tests/check-terms.test.ts 搬入（ADR 0002 E 批）；
// 用詞表是產品的，這裡用夾具（與 inknock 同形）。inknock 那邊另保留 CLI 層的測試（它自己的用詞表、exit code）。
import { describe, expect, it } from 'vitest'
import { scanTerms } from '../../src/gates/terms-gate.js'

const DICT = { deprecated: { 廠商: '改用 TERMS.supplier', 招待: '改用 TERMS.comp' }, forbidden: { 'NT$': '金額一律用 $，請改用 fmtMoney（@/src/shared/format）' } }
const run = src => scanTerms('x.tsx', src, DICT)

describe('terms-gate', () => {
  it('JSX 文字、樣板字串、一般字串裡的禁用符號 → 紅，訊息指向替代寫法', () => {
    expect(run('export const A = () => <div>NT${1}</div>')).toEqual(['x.tsx:1  「NT$」→ 金額一律用 $，請改用 fmtMoney（@/src/shared/format）'])
    expect(run('export const a = (n: number) => `NT$${n}`')).toHaveLength(1)
    expect(run("export const a = '單位 (NT$)'")).toHaveLength(1)
  })
  it('舊詞 → 紅，並指向 TERMS 鍵；字串、樣板字串、JSX 文字都算', () => {
    expect(run("export const a = (s: string) => s === 'refunded' ? '招待（已退費）' : '招待'")).toEqual(['x.tsx:1  「招待」→ 改用 TERMS.comp', 'x.tsx:1  「招待」→ 改用 TERMS.comp'])
    expect(run('export const a = (n: number) => `招待 ${n} 筆`')).toHaveLength(1)
    expect(run('export const A = () => <span>招待</span>')).toHaveLength(1)
    expect(run("export const a = '廠商'")).toEqual(['x.tsx:1  「廠商」→ 改用 TERMS.supplier'])
  })
  it('註解裡的不算、乾淨寫法不算', () => {
    expect(run('// 舊版寫 NT$450\nexport const a = 1')).toEqual([])
    expect(run("// 舊匯出曾寫「招待」\nexport const a = '公關（已退費）'")).toEqual([])
    expect(run("export const a = (n: number) => fmt(n) + ' $'")).toEqual([])
  })
  it('沒給用詞表就丟錯（不靜默放行）', () => {
    expect(() => scanTerms('x.tsx', "export const a = '廠商 NT$'")).toThrow(/沒有用詞表/)
    expect(() => scanTerms('x.tsx', "export const a = '廠商 NT$'", { deprecated: {}, forbidden: {} })).toThrow(/沒有用詞表/)
  })
})
