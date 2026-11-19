// 2026-11-19 自 inknock tests/field-description.test.tsx 搬入（inknock ADR 0002 D3 批）；主題改用測試夾具 helpers/test-theme。
// @vitest-environment jsdom
// 第 17 批（2026-11-17，使用者「照建議繼續」）：FormField 的錯誤訊息／說明文字連到欄位（aria-describedby）。
// 第 16 批 review：補了標籤之後，報讀聚焦時仍只念「無效」、不念原因（建品牌、密碼設定、職稱、分類名稱…）。
// 做法：FormField 經 context 把說明 id 交給四種欄位的共用 useFieldState，呼叫端不必改；群組掛在群組上。
import { ThemeProvider } from '../../src/ui/theme-context'
import { renderWithTheme, testTheme } from './helpers/test-theme'
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { installMatchMedia } from './helpers/match-media'
installMatchMedia(false)
import { FormField } from '../../src/ui/form-field'
import { Input } from '../../src/ui/input'
import { Select } from '../../src/ui/select'
import { Textarea } from '../../src/ui/textarea'
import { NumberInput } from '../../src/ui/number-input'
import { ComboBox } from '../../src/ui/combobox'

const desc = (el: HTMLElement) => (el.getAttribute('aria-describedby') ?? '').split(' ').filter(Boolean).map(id => document.getElementById(id)?.textContent)

describe('錯誤／說明文字連到欄位', () => {
  it('四種欄位都帶上 aria-describedby，指向錯誤訊息；有錯誤時不再念說明', () => {
    render(<ThemeProvider theme={testTheme}>
      <FormField label="名稱" htmlFor="a" error="名稱不可空白" helper="最多 20 字"><Input id="a" value="" onChange={() => {}} error /></FormField>
      <FormField label="分類" htmlFor="b" error="請選分類"><Select id="b" error><option>x</option></Select></FormField>
      <FormField label="備註" htmlFor="c" error="太長了"><Textarea id="c" error /></FormField>
      <FormField label="價格" htmlFor="d" error="要大於 0"><NumberInput id="d" value="" onChange={() => {}} error /></FormField>
    </ThemeProvider>)
    expect(desc(screen.getByRole('textbox', { name: '名稱' }))).toEqual(['名稱不可空白'])
    expect(desc(screen.getByRole('combobox', { name: '分類' }))).toEqual(['請選分類'])
    expect(desc(screen.getByRole('textbox', { name: '備註' }))).toEqual(['太長了'])
    expect(desc(screen.getByRole('textbox', { name: '價格' }))).toEqual(['要大於 0'])
  })

  it('只有說明時指向說明；沒有說明也沒有錯誤時不帶屬性', () => {
    render(<ThemeProvider theme={testTheme}>
      <FormField label="到職日" htmlFor="j" helper="年資由到職日自動計算"><Input id="j" value="" onChange={() => {}} /></FormField>
      <FormField label="電話" htmlFor="p"><Input id="p" value="" onChange={() => {}} /></FormField>
    </ThemeProvider>)
    expect(desc(screen.getByRole('textbox', { name: '到職日' }))).toEqual(['年資由到職日自動計算'])
    expect(screen.getByRole('textbox', { name: '電話' }).hasAttribute('aria-describedby')).toBe(false)
  })

  it('呼叫端自己的 aria-describedby 保留並合併（不被蓋掉）', () => {
    render(<ThemeProvider theme={testTheme}>
      <span id="own">另見上方提示</span>
      <FormField label="Email" htmlFor="e" error="格式不正確"><Input id="e" aria-describedby="own" value="" onChange={() => {}} error /></FormField>
    </ThemeProvider>)
    expect(desc(screen.getByRole('textbox', { name: 'Email' }))).toEqual(['另見上方提示', '格式不正確'])
  })

  it('group：說明掛在群組上，裡面的控制項不各自帶（不重複念）', () => {
    render(<ThemeProvider theme={testTheme}>
      <FormField label="開始時間" group helper="依設計師排班"><select aria-label="時" /><Select aria-label="分"><option>0</option></Select></FormField>
    </ThemeProvider>)
    const g = screen.getByRole('group', { name: '開始時間' })
    expect(desc(g)).toEqual(['依設計師排班'])
    expect(screen.getByRole('combobox', { name: '分' }).hasAttribute('aria-describedby')).toBe(false)
  })

  it('FormField 外的欄位不受影響', () => {
    renderWithTheme(<Input aria-label="搜尋" value="" onChange={() => {}} />)
    expect(screen.getByRole('textbox', { name: '搜尋' }).hasAttribute('aria-describedby')).toBe(false)
  })

  // ── review 修正 ──
  it('只套用在標籤指向的那個欄位：children 裡的次要欄位不誤掛', () => {
    render(<ThemeProvider theme={testTheme}>
      <FormField label="名稱" htmlFor="m" error="名稱不可空白">
        <Input id="m" value="" onChange={() => {}} />
        <Input aria-label="次要" value="" onChange={() => {}} />
      </FormField>
    </ThemeProvider>)
    expect(desc(screen.getByRole('textbox', { name: '名稱' }))).toEqual(['名稱不可空白'])
    const other = screen.getByRole('textbox', { name: '次要' })
    expect(other.hasAttribute('aria-describedby')).toBe(false)
    expect(other.hasAttribute('aria-invalid')).toBe(false)
  })

  it('只在 FormField 給 error（欄位沒給）：說明連到欄位，但不強制紅框／aria-invalid（補審撤回：呼叫端關不掉、表單層級錯誤會標錯欄位）', () => {
    renderWithTheme(<FormField label="代碼" htmlFor="k" error="代碼已被使用"><Input id="k" value="" onChange={() => {}} /></FormField>)
    const el = screen.getByRole('textbox', { name: '代碼' })
    expect(desc(el)).toEqual(['代碼已被使用'])
    expect(el.hasAttribute('aria-invalid')).toBe(false)
  })

  it('錯誤訊息不是 role=alert（補審撤回：逐字驗證會邊打邊插話、送出時多欄搶播）；說明↔錯誤切換時 id 不變', () => {
    const { rerender } = renderWithTheme(<FormField label="x" htmlFor="x" helper="說明"><Input id="x" value="" onChange={() => {}} /></FormField>)
    const before = screen.getByRole('textbox', { name: 'x' }).getAttribute('aria-describedby')
    rerender(<FormField label="x" htmlFor="x" error="錯了"><Input id="x" value="" onChange={() => {}} /></FormField>)
    expect(screen.queryByRole('alert')).toBeNull()
    expect(screen.getByRole('textbox', { name: 'x' }).getAttribute('aria-describedby')).toBe(before)
    expect(desc(screen.getByRole('textbox', { name: 'x' }))).toEqual(['錯了'])
  })

  it('帶後綴的數字欄（grouped 路徑）也接得到', () => {
    renderWithTheme(<FormField label="比例" htmlFor="r" helper="0～100"><NumberInput id="r" value="" onChange={() => {}} suffix="%" /></FormField>)
    expect(desc(screen.getByRole('textbox', { name: '比例' }))).toEqual(['0～100'])
  })

  it('搜尋選單（ComboBox 的輸入框）也接得到', () => {
    render(<ThemeProvider theme={testTheme}>
      <FormField label="推薦人" htmlFor="cb" error="不可選本人">
        <ComboBox id="cb" label="推薦人" query="" onQueryChange={() => {}} items={[] as string[]} getKey={x => x} getLabel={x => x} onSelect={() => {}} />
      </FormField>
    </ThemeProvider>)
    expect(desc(screen.getByRole('combobox', { name: '推薦人' }))).toEqual(['不可選本人'])
  })

  it('巢狀 FormField：內層欄位只接內層的說明', () => {
    render(<ThemeProvider theme={testTheme}>
      <FormField label="外" htmlFor="out" helper="外層說明">
        <Input id="out" value="" onChange={() => {}} />
        <FormField label="內" htmlFor="in"><Input id="in" value="" onChange={() => {}} /></FormField>
      </FormField>
    </ThemeProvider>)
    expect(desc(screen.getByRole('textbox', { name: '外' }))).toEqual(['外層說明'])
    expect(screen.getByRole('textbox', { name: '內' }).hasAttribute('aria-describedby')).toBe(false)
  })

  it('group 沒有標籤時：外層仍是 group（generic div 的 describedby 報讀器不念），說明掛在上面', () => {
    renderWithTheme(<FormField group error="請至少選一項"><Select aria-label="a"><option>a</option></Select></FormField>)
    expect(desc(screen.getByRole('group'))).toEqual(['請至少選一項'])
  })
})
