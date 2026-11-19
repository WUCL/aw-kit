// 2026-11-19 自 inknock tests/focus-ring.test.ts 搬入（inknock ADR 0002 D3 批）；主題改用測試夾具 helpers/test-theme。
// 聚焦外圈：2026-11-18 使用者在比較頁選「實色 2px」（第 28 批①）。
// 舊的 3px、50% 半透明外圈對白底只有 2.26:1（WCAG 1.4.11 要 3:1）；實色 accent-600 對白 6.54:1。
// 守的是「8 個 primitives 都是同一種外圈、沒有人退回半透明」。外觀數值本身以比較頁 tmp/visual-decisions-compare.html 確認。
import { describe, expect, it } from 'vitest'
import { buttonVariants } from '../../src/ui/primitives/button'
import { checkboxBoxClassName } from '../../src/ui/primitives/checkbox'
import { inputClassName } from '../../src/ui/primitives/input'
import { nativeSelectClassName } from '../../src/ui/primitives/native-select'
import { numberGroupClassName } from '../../src/ui/primitives/number-field'
import { switchClassName } from '../../src/ui/primitives/switch'
import { tabsTriggerClassName } from '../../src/ui/primitives/tabs'
import { textareaClassName } from '../../src/ui/primitives/textarea'

const tokens = (cls: string) => cls.split(/\s+/).filter(Boolean)

const all: [string, string, 'focus-visible' | 'focus-within'][] = [
  ['button', buttonVariants({}), 'focus-visible'],
  ['checkbox', checkboxBoxClassName, 'focus-visible'],
  ['input', inputClassName, 'focus-visible'],
  ['native-select', nativeSelectClassName, 'focus-visible'],
  ['number-field', numberGroupClassName, 'focus-within'],
  ['switch', switchClassName, 'focus-visible'],
  ['tabs', tabsTriggerClassName, 'focus-visible'],
  ['textarea', textareaClassName, 'focus-visible'],
]

// 任何聚焦相關變體（含錯誤＋聚焦）後面接半透明品牌色或 3px 寬，都算退回舊外圈
const OLD = /(?:^|:)(?:focus-visible|focus-within|data-focus-visible):ring-(?:ring\/\d+|3|\[3px\])$/

describe('聚焦外圈一律實色 2px', () => {
  it.each(all)('%s：聚焦時 2px 實色品牌色', (_n, cls, v) => {
    const list = tokens(cls)
    expect(list).toContain(`${v}:ring-2`)
    expect(list).toContain(`${v}:ring-ring`)
    expect(list.filter(t => OLD.test(t))).toEqual([])
  })

  it.each([
    ['input', inputClassName],
    ['native-select', nativeSelectClassName],
    ['textarea', textareaClassName],
  ])('%s：錯誤＋聚焦也是 2px 實色品牌色，錯誤（未聚焦）仍是淡紅', (_n, cls) => {
    const list = tokens(cls)
    expect(list).toContain('aria-invalid:focus-visible:ring-2')
    expect(list).toContain('aria-invalid:focus-visible:ring-ring')
    expect(list).toContain('aria-invalid:ring-danger-base/20')
  })

  it.each([
    ['button', buttonVariants({})],
    ['checkbox', checkboxBoxClassName],
    ['switch', switchClassName],
  ])('%s：錯誤（aria-invalid）＋聚焦也是 2px 實色品牌色（review：原本漏了這三個，錯誤時看不出焦點）', (_n, cls) => {
    const list = tokens(cls)
    expect(list).toContain('aria-invalid:focus-visible:ring-2')
    expect(list).toContain('aria-invalid:focus-visible:ring-ring')
  })

  // review：只看預設 variant 會漏掉「某個 variant 自己覆寫外圈色」（danger 原本是 20% 淡紅）。
  // buttonVariants 輸出的 class 串裡，每個 variant × size 的聚焦外圈只能是品牌色 2px、聚焦框線只能是品牌色。
  const variants = ['default', 'outline', 'secondary', 'ghost', 'destructive', 'cta', 'link'] as const
  const sizes = ['default', 'xs', 'sm', 'lg', 'icon', 'icon-xs', 'icon-sm', 'icon-lg'] as const
  it.each(variants.flatMap(v => sizes.map(sz => [v, sz] as const)))('button %s／%s：聚焦外圈只有品牌色 2px', (variant, size) => {
    const ring = tokens(buttonVariants({ variant, size })).filter(t => /^focus-visible:ring-/.test(t) && !/^focus-visible:ring-(inset|offset)/.test(t))
    expect(ring.sort()).toEqual(['focus-visible:ring-2', 'focus-visible:ring-ring'])
    const border = tokens(buttonVariants({ variant, size })).filter(t => /^focus-visible:border-/.test(t))
    expect(border).toEqual(['focus-visible:border-ring'])
  })

  it.each([
    ['checkbox', checkboxBoxClassName],
    ['switch', switchClassName],
  ])('%s：React Aria 版的錯誤＋鍵盤聚焦（data-invalid＋data-focus-visible）也是品牌色 2px（補審）', (_n, cls) => {
    const list = tokens(cls)
    expect(list).toContain('data-invalid:data-focus-visible:ring-2')
    expect(list).toContain('data-invalid:data-focus-visible:ring-ring')
  })

  it('數字欄錯誤＋聚焦同上', () => {
    const list = tokens(numberGroupClassName)
    expect(list).toContain('data-invalid:focus-within:ring-2')
    expect(list).toContain('data-invalid:focus-within:ring-ring')
  })

  it('OLD 判得出舊寫法（鑑別力）', () => {
    for (const t of ['focus-visible:ring-ring/50', 'focus-visible:ring-3', 'focus-visible:ring-[3px]', 'aria-invalid:focus-visible:ring-ring/50', 'focus-within:ring-ring/50', 'data-focus-visible:ring-3']) {
      expect(OLD.test(t)).toBe(true)
    }
    for (const t of ['focus-visible:ring-2', 'focus-visible:ring-ring', 'aria-invalid:ring-3', 'aria-invalid:ring-danger-base/20']) {
      expect(OLD.test(t)).toBe(false)
    }
  })
})
