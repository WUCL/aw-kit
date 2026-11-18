// @vitest-environment node
// aw-kit/design-tokens：共用層（BASE）↔ src/ui/theme.ts 一致、品牌層驗證會擋、產生器的防呆。
// 一致性檢查照搬 inknock tests/design-tokens.test.ts 的共用層部分（2026-11-19）；品牌層那半留在各專案。
import { describe, expect, it } from 'vitest'
import { BASE, BRAND_COLOR_NAMES, COLOR_ORDER, mergeDesign, readFrontmatter, render, renderNames, resolveRef } from '../../src/design-tokens/index.js'
import { CONTROL_H, FONT_SIZE, FONT_WEIGHT, GAP, INTERACTION, LINE_HEIGHT, PAD, RADIUS, ROW_H, SHADOW, SPACING, STATE } from '../../src/ui/theme.ts'

const camel = k => k.replace(/-(\w)/g, (_, c) => c.toUpperCase())
const num = v => (typeof v === 'number' ? v : Number(String(v).replace(/px$/, '')))

// 共用層狀態色在 DESIGN.md 的名稱 → theme.ts 的位置（名稱不同、值相同）
const STATE_COLOR = {
  'amber-bg': STATE.warning.bg, 'amber-ink': STATE.warning.text, 'amber-border': STATE.warning.border, 'amber-dark': STATE.warning.dark,
  'danger-bg': STATE.danger.bg, 'danger-ink': STATE.danger.text, 'danger-base': STATE.danger.base, 'danger-dark': STATE.danger.dark,
  'marker-ink': STATE.marker.dark, 'marker-border': STATE.marker.border,
  'neutral-bg': STATE.neutral.bg, 'neutral-ink': STATE.neutral.text, 'hover-surface': INTERACTION.hoverSurface,
}

describe('BASE ↔ src/ui/theme.ts', () => {
  it('狀態色（兩邊名稱集合相同、值相同）', () => {
    expect(Object.keys(BASE.colors).sort()).toEqual(Object.keys(STATE_COLOR).sort())
    for (const [k, v] of Object.entries(BASE.colors)) expect(STATE_COLOR[k].toUpperCase(), k).toBe(v.toUpperCase())
  })
  it('字級（且共用層不含字體——字體是品牌層）', () => {
    expect(Object.keys(BASE.typography).map(camel).sort()).toEqual(Object.keys(FONT_SIZE).sort())
    for (const [k, t] of Object.entries(BASE.typography)) {
      expect(FONT_SIZE[camel(k)], k).toBe(num(t.fontSize))
      expect(t.fontFamily, k).toBeUndefined()
    }
  })
  it('陰影（兩邊鍵集合相同、值相同；只差小數點前的 0 寫法）', () => {
    const norm = v => String(v).replace(/(^|[^\d])\.(\d)/g, '$10.$2')
    expect(Object.keys(BASE.shadow).sort()).toEqual(Object.keys(SHADOW).sort())
    for (const [k, v] of Object.entries(BASE.shadow)) expect(norm(SHADOW[k]), k).toBe(norm(v))
  })
  it('字級的行高、字重對得上 LINE_HEIGHT／FONT_WEIGHT', () => {
    // 字級角色 → LINE_HEIGHT 的名稱（theme.ts 以用途命名，不是一對一同名）
    const LH = { caption: 'title', meta: 'title', body: 'body', 'body-lg': 'body', title: 'snug', 'page-title': 'page', amount: 'amount', kpi: 'tight' }
    expect(Object.keys(LH).sort()).toEqual(Object.keys(BASE.typography).sort())
    // 字重逐角色對照（只檢查「在 FONT_WEIGHT 裡」的話，caption 500→700 也會綠）
    const FW = { caption: 'medium', meta: 'medium', body: 'normal', 'body-lg': 'medium', title: 'semibold', 'page-title': 'semibold', amount: 'bold', kpi: 'bold' }
    for (const [k, t] of Object.entries(BASE.typography)) {
      expect(LINE_HEIGHT[LH[k]], `${k}.lineHeight`).toBe(t.lineHeight)
      expect(FONT_WEIGHT[FW[k]], `${k}.fontWeight`).toBe(t.fontWeight)
    }
  })
  it('間距階梯', () => {
    expect(Object.keys(BASE.spacing).sort()).toEqual(Object.keys(SPACING).sort())
    for (const [k, v] of Object.entries(BASE.spacing)) expect(SPACING[k], k).toBe(num(v))
  })
  it('情境別名 gap／pad（鍵集合也要相同）', () => {
    for (const [group, impl] of [['gap', GAP], ['pad', PAD]]) {
      const entries = Object.entries(BASE[group])
      expect(entries.map(([k]) => camel(k)).sort(), group).toEqual(Object.keys(impl).sort())
      for (const [k, v] of entries) expect(impl[camel(k)], `${group}.${k}`).toBe(num(resolveRef(BASE, v)))
    }
  })
  it('控制項高度、版面列高、圓角', () => {
    for (const [key, impl] of [['control-height', CONTROL_H], ['row-height', ROW_H], ['rounded', RADIUS]]) {
      expect(Object.keys(BASE[key]).sort(), key).toEqual(Object.keys(impl).sort())
      for (const [k, v] of Object.entries(BASE[key])) expect(impl[k], `${key}.${k}`).toBe(num(v))
    }
  })
})

const validBrand = () => ({
  name: 'demo',
  colors: Object.fromEntries(BRAND_COLOR_NAMES.map(k => [k, '#123456'])),
  'font-family': 'Inter, sans-serif',
})

describe('mergeDesign：品牌層驗證', () => {
  it('合規的品牌層 → 完整 frontmatter（顏色依 COLOR_ORDER、每個字級角色帶品牌字體）', () => {
    const fm = mergeDesign(validBrand())
    expect(Object.keys(fm.colors)).toEqual([...COLOR_ORDER])
    expect(fm.colors['danger-base']).toBe(BASE.colors['danger-base'])
    expect(fm.colors['accent-600']).toBe('#123456')
    expect(Object.values(fm.typography).every(t => t.fontFamily === 'Inter, sans-serif')).toBe(true)
    expect(fm.spacing).toEqual(BASE.spacing)
  })
  it('寫了共用層的鍵 → 報錯（共用層不准在專案覆寫）', () => {
    expect(() => mergeDesign({ ...validBrand(), spacing: { xs: '5px' } })).toThrow(/「spacing」是共用層/)
    expect(() => mergeDesign({ ...validBrand(), typography: {} })).toThrow(/「typography」是共用層/)
  })
  it('少一個品牌色、多一個不認得的名稱、寫了共用層狀態色 → 報錯並列出全部', () => {
    const b = validBrand()
    delete b.colors['ink']
    b.colors['brand-pink'] = '#f0f'
    b.colors['danger-base'] = '#f00'
    let msg = ''
    try { mergeDesign(b) } catch (e) { msg = e.message }
    expect(msg).toMatch(/缺少品牌色：ink/)
    expect(msg).toMatch(/不認得的品牌色名稱「brand-pink」/)
    expect(msg).toMatch(/「colors\.danger-base」是共用層狀態色/)
  })
  it('缺 font-family、品牌色空值、不認得的頂層鍵 → 報錯', () => {
    const b = validBrand()
    delete b['font-family']
    b.colors.surface = ' '
    b.foo = 1
    expect(() => mergeDesign(b)).toThrow(/缺少 font-family[\s\S]*/)
    expect(() => mergeDesign(b)).toThrow(/品牌色「surface」沒有值/)
    expect(() => mergeDesign(b)).toThrow(/不認得的鍵「foo」/)
  })
  it('components 的代幣引用：合成後解析得到 → 通過；打錯字 → 報錯並指出位置', () => {
    expect(() => mergeDesign({ ...validBrand(), components: { btn: { rounded: '{rounded.md}', bg: '{colors.amber-bg}', fg: '{colors.ink}', pad: '0 10px' } } })).not.toThrow()
    expect(() => mergeDesign({ ...validBrand(), components: { btn: { rounded: '{rounded.mdd}' } } })).toThrow(/components\.btn\.rounded：\{rounded\.mdd\}/)
  })
  it('components：嵌在長值裡的錯誤引用、三段式引用、原型鏈名稱 → 報錯', () => {
    const bad = c => () => mergeDesign({ ...validBrand(), components: { x: c } })
    expect(bad({ border: '1px solid {colors.lin}' })).toThrow(/\{colors\.lin\}/)
    expect(bad({ padding: '{spacing.sm} {spacing.smm}' })).toThrow(/\{spacing\.smm\}/)
    expect(bad({ font: '{typography.body.fontSize}' })).toThrow(/\{typography\.body\.fontSize\}/)
    expect(bad({ bg: '{colors.constructor}' })).toThrow(/\{colors\.constructor\}/)
    expect(() => mergeDesign({ ...validBrand(), components: { x: { border: '1px solid {colors.line} / {spacing.sm}' } } })).not.toThrow()
  })
  it('colors 不是對照表 → 列入問題清單，不丟出原生 TypeError', () => {
    expect(() => mergeDesign({ ...validBrand(), colors: '#fff' })).toThrow(/品牌層不合規[\s\S]*colors 必須是/)
  })
  it('frontmatter 接受 CRLF 與結尾沒有換行', () => {
    expect(readFrontmatter('---\r\n{"a":1}\r\n---\r\n# x', JSON.parse)).toEqual({ a: 1 })
    expect(readFrontmatter('---\n{"a":1}\n---', JSON.parse)).toEqual({ a: 1 })
  })
  it('不會改到 BASE（回傳的是複本）', () => {
    const fm = mergeDesign(validBrand())
    fm.spacing.xs = '999px'
    expect(BASE.spacing.xs).toBe('4px')
  })
})

describe('產生器防呆', () => {
  it('沒有 frontmatter → 報錯；沒給 YAML 解析函式 → 報錯（本模組不依賴 YAML 套件）', () => {
    expect(() => readFrontmatter('# 無', JSON.parse)).toThrow(/沒有 frontmatter/)
    expect(() => readFrontmatter('---\n{}\n---\n')).toThrow(/需要 YAML 解析函式/)
    expect(readFrontmatter('---\n{"a":1}\n---\n', JSON.parse)).toEqual({ a: 1 })
  })
  it('引用不存在的代幣要報錯，不可靜默產生空值', () => {
    expect(() => resolveRef(BASE, '{spacing.nope}')).toThrow(/引用不存在/)
  })
  it('gap 與 pad 撞名要報錯（同一個 spacing 命名空間會靜默互蓋）', () => {
    const fm = mergeDesign(validBrand())
    expect(() => render({ ...fm, pad: { ...fm.pad, stack: '4px' } })).toThrow(/撞名：stack/)
  })
  it('少了 shadow.knob → 報錯，不產生 undefined', () => {
    const fm = mergeDesign(validBrand())
    expect(() => render({ ...fm, shadow: {} })).toThrow(/缺少 shadow\.knob/)
  })
  it('header 可由專案自訂；名稱檔列出字級、間距別名、陰影', () => {
    const fm = mergeDesign(validBrand())
    expect(render(fm, { header: ['/* x */'] }).split('\n')[0]).toBe('/* x */')
    const names = renderNames(fm, { header: [] })
    expect(names).toMatch(/TEXT_SIZES = \['caption'.*'kpi', 'xs', 'sm', 'base'\]/)
    expect(names).toMatch(/SHADOWS = \['knob'\]/)
  })
})
