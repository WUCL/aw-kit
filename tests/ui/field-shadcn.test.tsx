// 2026-11-19 自 inknock tests/field-shadcn.test.tsx 搬入（inknock ADR 0002 D3 批）；主題改用測試夾具 helpers/test-theme。
// @vitest-environment jsdom
// Input／Select／Textarea 換 shadcn（ADR 0001，2026-11-13）：包裝層渲染原生元素＋primitives 的 class 串，對外 props 不變。
// 這裡守的是「換外觀不換排版」與使用者定案的那幾點；外觀數值本身當時以比較頁在瀏覽器實測（驗收後已刪）。
import { describe, expect, it } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithTheme as render } from './helpers/test-theme'
import { Input } from '../../src/ui/input'
import { Select } from '../../src/ui/select'
import { Textarea } from '../../src/ui/textarea'
import { NumberInput } from '../../src/ui/number-input'
import { inputClassName } from '../../src/ui/primitives/input'
import { textareaClassName } from '../../src/ui/primitives/textarea'
import { nativeSelectClassName } from '../../src/ui/primitives/native-select'
import { installMatchMedia } from './helpers/match-media'

installMatchMedia(false)
const classes = (el: Element) => el.className.split(/\s+/)

describe('錯誤＋聚焦：外圈改品牌色（使用者 2026-11-13 選定，上游錯誤＋聚焦與錯誤長得一樣）', () => {
  it.each([
    ['inputClassName', inputClassName],
    ['textareaClassName', textareaClassName],
    ['nativeSelectClassName', nativeSelectClassName],
  ])('%s 錯誤＋聚焦外圈是品牌色（2026-11-18 起實色 2px），且錯誤外圈仍是淡紅', (_n, cls) => {
    const list = cls.split(/\s+/)
    expect(list).toContain('aria-invalid:focus-visible:ring-ring')
    expect(list).toContain('aria-invalid:ring-danger-base/20')
    expect(list).toContain('focus-visible:ring-ring')
  })

  it('四種欄位渲染出來都帶這組狀態 class', () => {
    render(<>
      <Input aria-label="a" error />
      <Select aria-label="b" error><option>x</option></Select>
      <Textarea aria-label="c" error />
      <NumberInput aria-label="d" value="" onChange={() => {}} error />
    </>)
    for (const n of ['a', 'b', 'c', 'd']) expect(classes(screen.getByLabelText(n))).toContain('aria-invalid:focus-visible:ring-ring')
  })
})

describe('三份狀態 class 不漂移（Textarea／Select 的狀態 class ＝ Input 的）', () => {
  // primitives 三支各自是上游字串＋inknock 改動。改其中一份的聚焦／錯誤外圈卻漏改其他份＝欄位長得不一樣（2026-11-13 review）。
  // 雙向比對（補審 2026-11-14）：只在其中一支加新的狀態 class 也要紅。NumberInput 自 2026-11-15 直接用 inputClassName（下一條測試守）。
  // 狀態 class＝focus-visible:／aria-invalid: 開頭＋disabled:cursor-not-allowed
  const stateOf = (cls: string) => cls.split(/\s+/)
    .filter(c => /^(focus-visible|aria-invalid):/.test(c) || c === 'disabled:cursor-not-allowed')
    .sort()
  it.each([
    ['textareaClassName', textareaClassName],
    ['nativeSelectClassName', nativeSelectClassName],
  ])('%s 的狀態 class 與 inputClassName 完全相同', (_n, cls) => {
    expect(stateOf(cls)).toEqual(stateOf(inputClassName))
  })

  it('NumberInput 與 Input 是同一串外觀 class（2026-11-15 數字欄批次：外觀收進元件，呼叫端不再各畫一份）', () => {
    render(<>
      <Input aria-label="i" />
      <NumberInput aria-label="n" value="" onChange={() => {}} />
    </>)
    const n = classes(screen.getByLabelText('n'))
    // 比實際渲染出的 Input（含包裝層的 min-w-auto 等），不是 primitives 原字串。刻意的差異只有：等寬數字、字重固定 400（不跟外層加粗）
    const extra = ['tabular-nums', 'font-normal']
    expect(n.filter(c => !extra.includes(c)).sort()).toEqual(classes(screen.getByLabelText('i')).sort())
    for (const c of extra) expect(n).toContain(c)
  })
})

describe('停用欄位收得到滑鼠（title 提示、禁止游標；同 Button，2026-11-15 數字欄補審）', () => {
  it.each([
    ['inputClassName', inputClassName],
    ['textareaClassName', textareaClassName],
    ['nativeSelectClassName', nativeSelectClassName],
  ])('%s 不設 disabled:pointer-events-none', (_n, cls) => {
    expect(cls.split(/\s+/)).not.toContain('disabled:pointer-events-none')
  })
})

describe('文字色不跟著容器變（scoped preflight 是 color: inherit）', () => {
  it.each([
    ['inputClassName', inputClassName],
    ['textareaClassName', textareaClassName],
    ['nativeSelectClassName', nativeSelectClassName],
  ])('%s 明寫 text-foreground', (_n, cls) => {
    expect(cls.split(/\s+/)).toContain('text-foreground')
  })
})

describe('換外觀不換排版', () => {
  it('Select 不包外層 div：呼叫端 style（flex、width）仍落在 <select> 本身', () => {
    const { container } = render(<div data-testid="row"><Select aria-label="店" style={{ flexShrink: 0, width: 130 }}><option>全部分店</option></Select></div>)
    const el = screen.getByLabelText('店')
    expect(el.tagName).toBe('SELECT')
    expect(el.parentElement).toBe(container.querySelector('[data-testid="row"]'))
    expect(el.style.flexShrink).toBe('0')
    expect(el.style.width).toBe('130px')
  })

  it('Input／Select 不帶上游的 min-w-0（工具列裡會被壓到看不見字，比較頁實測 130→83）', () => {
    render(<><Input aria-label="a" /><Select aria-label="b"><option>x</option></Select></>)
    for (const n of ['a', 'b']) {
      const c = classes(screen.getByLabelText(n))
      expect(c).toContain('min-w-auto')
      expect(c).not.toContain('min-w-0')
    }
  })

  it('fullWidth={false} 不撐滿；預設撐滿', () => {
    render(<><Input aria-label="a" fullWidth={false} /><Input aria-label="b" /><Select aria-label="c" fullWidth={false}><option>x</option></Select></>)
    expect(classes(screen.getByLabelText('a'))).toContain('w-auto')
    expect(classes(screen.getByLabelText('a'))).not.toContain('w-full')
    expect(classes(screen.getByLabelText('b'))).toContain('w-full')
    expect(classes(screen.getByLabelText('c'))).toContain('w-auto')
  })

  it('Textarea 只准上下拉（原本 resize: vertical）、初始高度由 rows 決定（不用 field-sizing-content）', () => {
    render(<><Textarea aria-label="t" /><Textarea aria-label="t5" rows={5} /></>)
    const c = classes(screen.getByLabelText('t'))
    expect(c).toContain('resize-y')
    expect(c).not.toContain('field-sizing-content')
    expect((screen.getByLabelText('t') as HTMLTextAreaElement).rows).toBe(3)
    expect((screen.getByLabelText('t5') as HTMLTextAreaElement).rows).toBe(5)
  })

  it('帶 data-slot（scoped preflight 靠它給框線樣式；少了框會不見）', () => {
    render(<><Input aria-label="a" /><Select aria-label="b"><option>x</option></Select><Textarea aria-label="c" /><Input aria-label="d" leftIcon={<span>$</span>} /></>)
    expect(screen.getByLabelText('a').dataset.slot).toBe('input')
    expect(screen.getByLabelText('b').dataset.slot).toBe('native-select')
    expect(screen.getByLabelText('c').dataset.slot).toBe('textarea')
    // 圖示外層也要在 data-slot 子樹內（圖示 span 的定位 class 才有 preflight 基準）
    expect(screen.getByLabelText('d').parentElement?.dataset.slot).toBe('input-icon-wrapper')
  })

  it('Select 停用時箭頭變淡（ink-faint），啟用時 muted', () => {
    render(<><Select aria-label="on"><option>x</option></Select><Select aria-label="off" disabled><option>x</option></Select></>)
    const img = (n: string) => decodeURIComponent((screen.getByLabelText(n) as HTMLElement).style.backgroundImage)
    expect(img('on')).toContain("d='m6 9 6 6 6-6'")
    expect(img('on')).not.toBe(img('off'))
  })
})
