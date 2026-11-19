// 2026-11-19 自 inknock tests/combobox.test.tsx 搬入（inknock ADR 0002 D3 批）；主題改用測試夾具 helpers/test-theme。
// @vitest-environment jsdom
// 搜尋選單（2026-11-16，ADR 0001 D4；使用者看比較頁 tmp/combobox-compare.html 確認「照建議」）。
// 守：WAI-ARIA combobox 結構、鍵盤、注音（含 Safari keyCode 229）、Esc 只收清單不關對話框、Enter 不送出表單、
// 清單與輸入框一致（換結果不沿用舊的目前列）、狀態文字（搜尋中／失敗≠找不到）。
import { useState } from 'react'
import { renderWithTheme } from './helpers/test-theme'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, screen } from '@testing-library/react'
import { ComboBox, type ComboBoxStatus } from '../../src/ui/combobox'
import { Modal } from '../../src/ui/modal'
import { menuContentClassName, menuItemClassName } from '../../src/ui/primitives/dropdown-menu'
import { installMatchMedia } from './helpers/match-media'

beforeEach(() => installMatchMedia())

type P = { id: string; name: string; phone: string | null }
const PEOPLE: P[] = [
  { id: '1', name: '陳怡君', phone: '0912345678' },
  { id: '2', name: '陳怡君', phone: '0988111222' },
  { id: '3', name: '陳美玲', phone: null },
]

function Harness({ status = 'ready', items = PEOPLE, onSelect = () => {}, action, initial = '' }: {
  status?: ComboBoxStatus; items?: P[]; onSelect?: (p: P) => void; action?: () => void; initial?: string
}) {
  const [q, setQ] = useState(initial)
  return (
    <ComboBox<P>
      label="客戶" query={q} onQueryChange={setQ}
      items={q.trim() ? items.filter(p => p.name.includes(q.trim())) : []}
      status={status}
      getKey={p => p.id} getLabel={p => p.name} getHint={p => p.phone ?? '未留電話'}
      onSelect={onSelect}
      action={action ? { label: `建立「${q.trim()}」`, onSelect: action } : undefined}
    />
  )
}
const ui = (node: React.ReactNode) => renderWithTheme(node)
const input = () => screen.getByRole('combobox') as HTMLInputElement
const type = (v: string) => { input().focus(); fireEvent.change(input(), { target: { value: v } }) }
const key = (k: string, extra: object = {}) => fireEvent.keyDown(input(), { key: k, ...extra })
const activeText = () => {
  const id = input().getAttribute('aria-activedescendant')
  return id ? document.getElementById(id)?.textContent : null
}

describe('ComboBox', () => {
  it('結構：combobox＋listbox＋option；清單掛在 body、外觀走下拉選單同一份 class；每列帶提示（電話）', () => {
    const { container } = ui(<Harness />)
    expect(input().getAttribute('aria-expanded')).toBe('false')
    type('陳')
    const list = screen.getByRole('listbox')
    expect(input().getAttribute('aria-expanded')).toBe('true')
    expect(input().getAttribute('aria-controls')).toBe(list.id)
    const panel = document.querySelector<HTMLElement>('[data-slot="combobox-content"]')!
    expect(container.contains(panel)).toBe(false) // portal：側邊面板有 transform，fixed 放在裡面會錯位
    expect(panel.className).toContain(menuContentClassName)
    expect(panel.contains(list)).toBe(true)
    expect([...list.children].every(c => c.getAttribute('role') === 'option')).toBe(true) // listbox 裡只有選項
    const opts = screen.getAllByRole('option')
    expect(opts.map(o => o.textContent)).toEqual(['陳怡君0912345678', '陳怡君0988111222', '陳美玲未留電話'])
    expect(opts[0].className).toContain(menuItemClassName)
  })

  it('沒有輸入時不開清單', () => {
    ui(<Harness />)
    input().focus(); fireEvent.focus(input())
    key('ArrowDown')
    expect(screen.queryByRole('listbox')).toBeNull()
  })

  it('↓↑ 移動目前列（循環），Enter 選取；焦點一直在輸入框', () => {
    const onSelect = vi.fn()
    ui(<Harness onSelect={onSelect} />)
    type('陳')
    expect(activeText()).toBeNull() // 打字不會自動標第一列：Enter 不會誤選
    key('ArrowDown'); expect(activeText()).toBe('陳怡君0912345678')
    key('ArrowDown'); key('ArrowDown'); key('ArrowDown'); expect(activeText()).toBe('陳怡君0912345678')
    key('ArrowUp'); expect(activeText()).toBe('陳美玲未留電話')
    key('ArrowUp'); key('ArrowUp')
    key('Enter')
    expect(onSelect).toHaveBeenCalledWith(PEOPLE[0])
    expect(document.activeElement).toBe(input())
    expect(screen.queryByRole('listbox')).toBeNull()
  })

  it('注音選字的 Enter／Esc（isComposing 或 Safari 的 keyCode 229）不選取、不收起', () => {
    const onSelect = vi.fn()
    ui(<Harness onSelect={onSelect} />)
    type('陳')
    key('ArrowDown')
    key('Enter', { keyCode: 229 })
    key('Enter', { isComposing: true })
    expect(onSelect).not.toHaveBeenCalled()
    key('Escape', { keyCode: 229 })
    expect(screen.queryByRole('listbox')).not.toBeNull()
  })

  it('注音組字中的 ↑↓（在選候選字）不移動清單（isComposing 或 keyCode 229）', () => {
    ui(<Harness />)
    type('陳')
    key('ArrowDown', { keyCode: 229 })
    key('ArrowDown', { isComposing: true })
    expect(activeText()).toBeNull()
    key('ArrowDown')
    expect(activeText()).toBe('陳怡君0912345678')
  })

  it('按 Esc 收起後焦點還在輸入框，再點一下會重新打開', () => {
    ui(<Harness />)
    type('陳')
    key('Escape')
    expect(screen.queryByRole('listbox')).toBeNull()
    fireEvent.click(input())
    expect(screen.queryByRole('listbox')).not.toBeNull()
  })

  it('footnote（結果被截斷）在有結果時顯示於清單底部、在 listbox 之外', () => {
    function WithNote() {
      const [q, setQ] = useState('陳')
      return <ComboBox<P> label="客戶" query={q} onQueryChange={setQ} items={PEOPLE} getKey={p => p.id} getLabel={p => p.name} onSelect={() => {}} footnote="只列出前 20 位" />
    }
    ui(<WithNote />)
    input().focus(); fireEvent.focus(input())
    const panel = document.querySelector<HTMLElement>('[data-slot="combobox-content"]')!
    expect(panel.lastElementChild?.textContent).toBe('只列出前 20 位')
    expect(screen.getByRole('listbox').textContent).not.toContain('只列出前 20 位')
  })

  it('打字就清掉目前列：新結果與舊的一樣也不會自己標回去（Enter 不會選到沒看的列）', () => {
    const onSelect = vi.fn()
    ui(<Harness onSelect={onSelect} />)
    type('陳怡')
    key('ArrowDown'); key('ArrowDown')
    expect(activeText()).toBe('陳怡君0988111222')
    type('陳怡君') // 結果仍是同樣兩位
    expect(activeText()).toBeNull()
    key('Enter')
    expect(onSelect).not.toHaveBeenCalled()
  })

  it('有項目又有動作列時，listbox 裡仍只有選項（分隔線畫在動作列上）', () => {
    ui(<Harness action={() => {}} />)
    type('陳')
    const list = screen.getByRole('listbox')
    expect([...list.children].map(c => c.getAttribute('role'))).toEqual(['option', 'option', 'option', 'option'])
    expect(list.lastElementChild!.className).toContain('before:bg-border')
  })

  it('失敗時給了 onRetry 就有「重試」鈕；footnote 在「找不到」時也出現（篩掉後空了也可能還有更多）', () => {
    const onRetry = vi.fn()
    function WithRetry({ status }: { status: ComboBoxStatus }) {
      const [q, setQ] = useState('陳')
      return <ComboBox<P> label="客戶" query={q} onQueryChange={setQ} items={[]} status={status} getKey={p => p.id} getLabel={p => p.name} onSelect={() => {}} onRetry={onRetry} footnote="只列出前 20 位" />
    }
    const { rerender } = ui(<WithRetry status="error" />)
    input().focus(); fireEvent.focus(input())
    fireEvent.click(screen.getByRole('button', { name: '重試' }))
    expect(onRetry).toHaveBeenCalledTimes(1)
    // 鍵盤：焦點在輸入框、重試鈕在清單裡 Tab 不到——Enter 就是重試（整包 review）
    fireEvent.keyDown(input(), { key: 'Enter' })
    expect(onRetry).toHaveBeenCalledTimes(2)
    fireEvent.keyDown(input(), { key: 'Enter', keyCode: 229 })   // 注音選字的 Enter 不重試
    expect(onRetry).toHaveBeenCalledTimes(2)
    expect(document.querySelector('[data-slot="combobox-content"]')!.textContent).not.toContain('只列出前 20 位')
    rerender(<WithRetry status="ready" />)
    expect(document.querySelector('[data-slot="combobox-content"]')!.textContent).toBe('找不到符合的項目只列出前 20 位')
  })

  it('失敗時若有 onEnterWithoutActive（Enter＝採用打的字）：Enter 走它、不重試（補審）', () => {
    const onRetry = vi.fn(); const onEnter = vi.fn()
    function Both() {
      const [q, setQ] = useState('陳')
      return <ComboBox<P> label="品項" query={q} onQueryChange={setQ} items={[]} status="error" getKey={p => p.id} getLabel={p => p.name} onSelect={() => {}} onRetry={onRetry} onEnterWithoutActive={onEnter} />
    }
    ui(<Both />)
    input().focus(); fireEvent.focus(input())
    fireEvent.keyDown(input(), { key: 'Enter' })
    expect(onEnter).toHaveBeenCalledTimes(1)
    expect(onRetry).not.toHaveBeenCalled()
  })

  it('showWhenEmpty：沒打字聚焦就開；emptyText={null} 且沒有任何內容時不開空殼', () => {
    function Empty({ items }: { items: P[] }) {
      const [q, setQ] = useState('')
      return <ComboBox<P> label="品項" query={q} onQueryChange={setQ} items={items} getKey={p => p.id} getLabel={p => p.name} onSelect={() => {}} showWhenEmpty emptyText={null} />
    }
    const { rerender } = ui(<Empty items={PEOPLE} />)
    input().focus(); fireEvent.focus(input())
    expect(screen.getAllByRole('option')).toHaveLength(3)
    rerender(<Empty items={[]} />)
    expect(document.querySelector('[data-slot="combobox-content"]')).toBeNull()
  })

  it('↓ 標了一列後滑鼠一動，鍵盤的目前列就清掉（畫面上只剩滑鼠那列亮），Enter 不會選走看不出來的那列', () => {
    const onSelect = vi.fn()
    ui(<Harness onSelect={onSelect} />)
    type('陳')
    key('ArrowDown')
    expect(activeText()).toBe('陳怡君0912345678')
    fireEvent.mouseMove(screen.getAllByRole('option')[2])
    expect(activeText()).toBeNull()
    key('Enter')
    expect(onSelect).not.toHaveBeenCalled()
  })

  it('提示（電話、庫存）不縮不換行：長名稱時不會被擠成兩三行', () => {
    ui(<Harness />)
    type('陳')
    const hint = screen.getAllByRole('option')[0].lastElementChild!
    expect(hint.classList.contains('shrink-0')).toBe(true)
    expect(hint.classList.contains('whitespace-nowrap')).toBe(true)
  })

  it('清單開著：Esc 只收清單（defaultPrevented），所在的對話框不關；再按一次 Esc 才關對話框', () => {
    const onClose = vi.fn()
    ui(<Modal open onClose={onClose} title="指定客戶"><Harness /></Modal>)
    type('陳')
    key('Escape')
    expect(screen.queryByRole('listbox')).toBeNull()
    expect(onClose).not.toHaveBeenCalled()
    key('Escape')
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('清單開著、沒有目前列時 Enter 什麼都不做，也不送出外層表單；清單沒開時 Enter 照常送出', () => {
    const onSubmit = vi.fn((e: React.FormEvent) => e.preventDefault())
    const onSelect = vi.fn()
    ui(<form onSubmit={onSubmit}><Harness onSelect={onSelect} /><button type="submit">送出</button></form>)
    type('陳')
    expect(fireEvent.keyDown(input(), { key: 'Enter' })).toBe(false) // preventDefault → 瀏覽器不會隱式送出表單
    expect(onSelect).not.toHaveBeenCalled()
    key('Escape')
    expect(fireEvent.keyDown(input(), { key: 'Enter' })).toBe(true)
  })

  it('結果換了就不沿用舊的目前列（同一個位置已經是別人）', () => {
    const onSelect = vi.fn()
    const { rerender } = ui(<Harness onSelect={onSelect} items={PEOPLE} initial="陳" />)
    input().focus(); fireEvent.focus(input())
    key('ArrowDown'); key('ArrowDown')
    expect(activeText()).toBe('陳怡君0988111222')
    rerender(<Harness onSelect={onSelect} items={[PEOPLE[2], PEOPLE[0]]} initial="陳" />)
    expect(activeText()).toBeNull()
    key('Enter')
    expect(onSelect).not.toHaveBeenCalled()
  })

  it('點選（mousedown）選取，且不讓輸入框失焦；滑過不算目前列（Enter 不會選走滑過的那列），鍵盤移到的才有底色＋內框', () => {
    const onSelect = vi.fn()
    ui(<Harness onSelect={onSelect} />)
    type('陳')
    const opts = screen.getAllByRole('option')
    fireEvent.mouseMove(opts[2]); fireEvent.mouseEnter(opts[2])
    expect(opts[2].getAttribute('aria-selected')).toBe('false')
    key('Enter')
    expect(onSelect).not.toHaveBeenCalled()
    key('ArrowUp')
    const last = screen.getAllByRole('option')[2]
    expect(last.getAttribute('aria-selected')).toBe('true')
    expect(last.classList.contains('ring-inset')).toBe(true)
    const down = fireEvent.mouseDown(screen.getAllByRole('option')[1], { button: 0 })
    expect(down).toBe(false) // 預設被擋：輸入框不失焦
    expect(onSelect).toHaveBeenCalledWith(PEOPLE[1])
  })

  it('狀態：搜尋中、失敗、找不到三種文字分開；搜尋中與失敗時不列項目、不出現動作列', () => {
    const { rerender } = ui(<Harness status="loading" initial="陳" action={() => {}} />)
    input().focus(); fireEvent.focus(input())
    const panel = () => document.querySelector<HTMLElement>('[data-slot="combobox-content"]')!
    expect(screen.getByRole('status').textContent).toBe('搜尋中…')
    expect(screen.queryAllByRole('option')).toHaveLength(0)
    rerender(<Harness status="error" initial="陳" action={() => {}} />)
    expect(screen.getByRole('status').textContent).toBe('搜尋失敗，請檢查網路後重試')
    expect(screen.queryAllByRole('option')).toHaveLength(0)
    rerender(<Harness status="ready" initial="陳" items={[]} />)
    expect(panel().textContent).toBe('找不到符合的項目')
  })

  it('動作列在最後、以分隔線隔開，可用鍵盤選到', () => {
    const action = vi.fn()
    ui(<Harness action={action} />)
    type('陳美')
    const opts = screen.getAllByRole('option')
    expect(opts.map(o => o.textContent)).toEqual(['陳美玲未留電話', '建立「陳美」'])
    expect(opts[1].className).toContain('before:bg-border') // 分隔線畫在動作列上（listbox 裡不放非選項元素）
    key('ArrowDown'); key('ArrowDown'); key('Enter')
    expect(action).toHaveBeenCalledTimes(1)
  })
})
