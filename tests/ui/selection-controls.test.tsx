// 2026-11-19 自 inknock tests/selection-controls.test.tsx 搬入（inknock ADR 0002 D3 批）；主題改用測試夾具 helpers/test-theme。
// @vitest-environment jsdom
// 2026-11-15 UI library 第一階段第 2 批（ADR 0001〈外觀定案〉D3／D7、2026-11-13 對照圖勾選框）：
// Switch、Checkbox、Tabs（舊 Tabs＋Segmented 合併）。外觀數值以瀏覽器比較頁實測；這裡守行為與語意。
import { describe, expect, it, vi } from 'vitest'
import { ThemeProvider } from '../../src/ui/theme-context'
import { testTheme } from './helpers/test-theme'
import { fireEvent, render, screen } from '@testing-library/react'
import { createRef, useState } from 'react'
import { Switch } from '../../src/ui/switch'
import { Checkbox } from '../../src/ui/checkbox'
import { Tabs } from '../../src/ui/tabs'


describe('Switch', () => {
  it('role=switch＋aria-checked；點擊呼叫 onChange；選取狀態掛 data-selected 給樣式用', () => {
    const onChange = vi.fn()
    render(<Switch aria-label="測試" checked onChange={onChange} />)
    const sw = screen.getByRole('switch')
    expect(sw.getAttribute('aria-checked')).toBe('true')
    expect(sw.getAttribute('data-selected')).toBe('true')
    fireEvent.click(sw)
    expect(onChange).toHaveBeenCalledTimes(1)
  })
  it('未選取：沒有 data-selected（shadcn 的 data-selected 變體只認 "true"）', () => {
    render(<Switch aria-label="測試" checked={false} onChange={() => {}} />)
    expect(screen.getByRole('switch').hasAttribute('data-selected')).toBe(false)
  })
  it('停用：拿掉 onClick（不只靠 disabled 屬性擋）', () => {
    const onChange = vi.fn()
    render(<Switch aria-label="測試" checked={false} onChange={onChange} disabled />)
    const sw = screen.getByRole('switch') as HTMLButtonElement
    expect(sw.disabled).toBe(true)
    // disabled 被移除（例如有人用 devtools 拿掉）時仍不會觸發
    sw.disabled = false
    fireEvent.click(sw)
    expect(onChange).not.toHaveBeenCalled()
  })
})

describe('Checkbox', () => {
  it('原生 checkbox：label 包住時點文字會切換，onChange 拿得到 e.target.checked', () => {
    function Demo() {
      const [on, setOn] = useState(false)
      return <label><Checkbox checked={on} onChange={e => setOn(e.target.checked)} />整天</label>
    }
    render(<Demo />)
    const cb = screen.getByRole('checkbox', { name: '整天' }) as HTMLInputElement
    expect(cb.checked).toBe(false)
    fireEvent.click(screen.getByText('整天'))
    expect(cb.checked).toBe(true)
  })
  it('indeterminate prop 寫到 DOM 屬性上（React 不會幫忙設），改回 false 會清掉', () => {
    const { rerender } = render(<Checkbox aria-label="全選" checked={false} onChange={() => {}} indeterminate />)
    const cb = screen.getByRole('checkbox', { name: '全選' }) as HTMLInputElement
    expect(cb.indeterminate).toBe(true)
    rerender(<Checkbox aria-label="全選" checked onChange={() => {}} indeterminate={false} />)
    expect(cb.indeterminate).toBe(false)
  })
  it('點擊後呼叫端沒改狀態（被取消／唯讀擋下）：部分選取仍會寫回（瀏覽器點擊會自己清掉 DOM 的 indeterminate）', () => {
    const onChange = vi.fn()
    render(<Checkbox aria-label="全選" checked={false} onChange={onChange} indeterminate />)
    const cb = screen.getByRole('checkbox', { name: '全選' }) as HTMLInputElement
    fireEvent.click(cb)
    expect(onChange).toHaveBeenCalledTimes(1)
    expect(cb.indeterminate).toBe(true)
    expect(cb.checked).toBe(false)
  })
  it('呼叫端 onChange throw：部分選取一樣寫回', () => {
    render(<Checkbox aria-label="全選" checked={false} onChange={() => { throw new Error('x') }} indeterminate />)
    const cb = screen.getByRole('checkbox', { name: '全選' }) as HTMLInputElement
    // 事件處理器的錯誤由 jsdom 以 window error 事件回報；預期中的錯誤在這裡接住，不算未處理錯誤
    const errors: unknown[] = []
    const onError = (e: ErrorEvent) => { errors.push(e.error); e.preventDefault() }
    window.addEventListener('error', onError)
    const log = vi.spyOn(console, 'error').mockImplementation(() => {})
    try { fireEvent.click(cb) } finally { window.removeEventListener('error', onError); log.mockRestore() }
    expect(errors).toHaveLength(1)
    expect(cb.indeterminate).toBe(true)
  })
  it('停用時淡化放在外層（框與勾一起變淡），框本身不再自己疊一次透明度', () => {
    render(<Checkbox aria-label="停用" checked disabled onChange={() => {}} />)
    const cb = screen.getByRole('checkbox', { name: '停用' })
    const root = cb.closest('[data-slot="checkbox-root"]') as HTMLElement
    expect(root.className.split(/\s+/)).toContain('has-disabled:opacity-45')
    expect(cb.className.split(/\s+/)).toContain('disabled:opacity-100')
    expect(cb.className.split(/\s+/)).not.toContain('disabled:opacity-45')
    expect(cb.className.split(/\s+/)).toContain('group-has-disabled/field:opacity-100')
  })
  it('函式 ref 不會每次重繪都先收到 null', () => {
    const calls: (HTMLInputElement | null)[] = []
    const fn = (el: HTMLInputElement | null) => { calls.push(el) }
    const { rerender } = render(<Checkbox aria-label="r" ref={fn} checked={false} onChange={() => {}} />)
    rerender(<Checkbox aria-label="r" ref={fn} checked onChange={() => {}} />)
    expect(calls.filter(c => c === null)).toHaveLength(0)
  })
  it('ref 指到原生 input（物件與函式 ref 都可）', () => {
    const obj = createRef<HTMLInputElement>()
    let fnEl: HTMLInputElement | null = null
    render(<><Checkbox aria-label="a" ref={obj} /><Checkbox aria-label="b" ref={el => { fnEl = el }} /></>)
    expect(obj.current).toBe(screen.getByRole('checkbox', { name: 'a' }))
    expect(fnEl).toBe(screen.getByRole('checkbox', { name: 'b' }))
  })
})

const OPTS = [{ value: 'a', label: '甲' }, { value: 'b', label: '乙', count: 3 }, { value: 'c', label: '丙' }] as const

function Controlled({ variant, initial = 'a' as 'a' | 'b' | 'c' | null, onChange = () => {} }: {
  variant: 'line' | 'default'; initial?: 'a' | 'b' | 'c' | null; onChange?: (v: string) => void
}) {
  const [v, setV] = useState(initial)
  return <ThemeProvider theme={testTheme}><Tabs variant={variant} label="組" options={OPTS} value={v} onChange={x => { setV(x); onChange(x) }} idPrefix="t" /></ThemeProvider>
}

describe('Tabs（舊 Tabs＋Segmented 合併）', () => {
  it('line：tablist／tab＋aria-selected＋aria-controls；計數顯示在標籤旁', () => {
    render(<Controlled variant="line" />)
    expect(screen.getByRole('tablist', { name: '組' })).toBeTruthy()
    const tabs = screen.getAllByRole('tab')
    expect(tabs.map(t => t.getAttribute('aria-selected'))).toEqual(['true', 'false', 'false'])
    expect(tabs[0].id).toBe('t-tab-a')
    expect(tabs[0].getAttribute('aria-controls')).toBe('t-tabpanel-a')
    expect(tabs[1].textContent).toBe('乙3')
  })
  it('default：radiogroup／radio＋aria-checked（篩選條件，沿用舊 Segmented 語意），不產生 tab id', () => {
    render(<Controlled variant="default" />)
    expect(screen.getByRole('radiogroup', { name: '組' })).toBeTruthy()
    const radios = screen.getAllByRole('radio')
    expect(radios.map(r => r.getAttribute('aria-checked'))).toEqual(['true', 'false', 'false'])
    expect(radios[0].id).toBe('')
  })
  for (const variant of ['line', 'default'] as const) {
    it(`${variant}：只有選中那格在 Tab 順序；左右鍵循環移動並選取、Home／End 跳頭尾`, () => {
      const onChange = vi.fn()
      render(<Controlled variant={variant} onChange={onChange} />)
      const items = screen.getAllByRole(variant === 'line' ? 'tab' : 'radio')
      expect(items.map(i => i.tabIndex)).toEqual([0, -1, -1])
      items[0].focus()
      fireEvent.keyDown(items[0], { key: 'ArrowRight' })
      expect(document.activeElement).toBe(items[1])
      expect(onChange).toHaveBeenLastCalledWith('b')
      expect(items.map(i => i.tabIndex)).toEqual([-1, 0, -1])
      fireEvent.keyDown(items[1], { key: 'End' })
      expect(onChange).toHaveBeenLastCalledWith('c')
      fireEvent.keyDown(items[2], { key: 'ArrowRight' })   // 尾端往右回到第一格
      expect(onChange).toHaveBeenLastCalledWith('a')
      fireEvent.keyDown(items[0], { key: 'ArrowLeft' })    // 第一格往左到尾端
      expect(onChange).toHaveBeenLastCalledWith('c')
      fireEvent.keyDown(items[2], { key: 'Home' })
      expect(onChange).toHaveBeenLastCalledWith('a')
      expect(document.activeElement).toBe(items[0])
    })
  }
  it('帶 Alt／Cmd／Ctrl 的方向鍵不攔（瀏覽器上一頁、行首等快捷鍵）', () => {
    const onChange = vi.fn()
    render(<Controlled variant="line" onChange={onChange} />)
    const tab = screen.getAllByRole('tab')[0]
    for (const mod of ['altKey', 'metaKey', 'ctrlKey'] as const) {
      const ev = new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true, cancelable: true, [mod]: true })
      tab.dispatchEvent(ev)
      expect(ev.defaultPrevented).toBe(false)
    }
    expect(onChange).not.toHaveBeenCalled()
  })
  it('default（radiogroup）另認上下鍵；line（tablist）不攔上下鍵（頁面照常捲動）', () => {
    const onChange = vi.fn()
    render(<><Controlled variant="default" onChange={onChange} /><Controlled variant="line" /></>)
    const radios = screen.getAllByRole('radio')
    radios[0].focus()
    fireEvent.keyDown(radios[0], { key: 'ArrowDown' })
    expect(onChange).toHaveBeenLastCalledWith('b')
    fireEvent.keyDown(radios[1], { key: 'ArrowUp' })
    expect(onChange).toHaveBeenLastCalledWith('a')
    const tab = screen.getAllByRole('tab')[0]
    const ev = new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, cancelable: true })
    tab.dispatchEvent(ev)
    expect(ev.defaultPrevented).toBe(false)
  })
  it('高度與底線靠祖先 group/tabs＋data-orientation="horizontal"：拿掉就全部靜默失效', () => {
    render(<><Controlled variant="line" /><Controlled variant="default" /></>)
    for (const list of [screen.getByRole('tablist'), screen.getByRole('radiogroup')]) {
      const root = list.parentElement as HTMLElement
      expect(root.className.split(/\s+/)).toContain('group/tabs')
      expect(root.getAttribute('data-orientation')).toBe('horizontal')
    }
  })
  it('其他按鍵不攔（Tab 照常離開、Enter 不重選）', () => {
    const onChange = vi.fn()
    render(<Controlled variant="line" onChange={onChange} />)
    const tab = screen.getAllByRole('tab')[0]
    const ev = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true })
    tab.dispatchEvent(ev)
    expect(ev.defaultPrevented).toBe(false)
    fireEvent.keyDown(tab, { key: 'Enter' })
    expect(onChange).not.toHaveBeenCalled()
  })
  it('default 沒有選任何一格（value=null）：第一格進 Tab 順序，整組仍可用鍵盤到達', () => {
    render(<Controlled variant="default" initial={null} />)
    const radios = screen.getAllByRole('radio')
    expect(radios.map(r => r.tabIndex)).toEqual([0, -1, -1])
    expect(radios.every(r => r.getAttribute('aria-checked') === 'false')).toBe(true)
  })
  it('點擊選取；選中那格掛 data-selected="true"（shadcn 樣式變體只認 "true"）', () => {
    render(<Controlled variant="default" />)
    fireEvent.click(screen.getByRole('radio', { name: '丙' }))
    expect(screen.getByRole('radio', { name: '丙' }).getAttribute('data-selected')).toBe('true')
    expect(screen.getByRole('radio', { name: '甲' }).hasAttribute('data-selected')).toBe(false)
  })
})
