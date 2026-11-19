// 2026-11-19 自 inknock tests/number-input-component.test.tsx 搬入（inknock ADR 0002 D3 批）；主題改用測試夾具 helpers/test-theme。
// @vitest-environment jsdom
import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { fireEvent, screen } from '@testing-library/react'
import { renderWithTheme } from './helpers/test-theme'
import { NumberInput } from '../../src/ui/number-input'
import { Input } from '../../src/ui/input'
import { installMatchMedia } from './helpers/match-media'

installMatchMedia(false)

// 模擬輸入法組字中的一次輸入：真的改掉 DOM 值（繞過 React 的值追蹤，否則 React 視為沒變、不觸發 onChange，測試會空洞地通過），
// 再派發 isComposing=true 的 input 事件
function composingInput(el: HTMLInputElement, v: string) {
  Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(el, v)
  el.dispatchEvent(new InputEvent('input', { bubbles: true, isComposing: true }))
}

describe('數字欄元件：打字時清洗（2026-09-29）', () => {
  it('<NumberInput> 把全形與英文清掉後才交給 onChange', () => {
    const onChange = vi.fn()
    renderWithTheme(<NumberInput aria-label="價" value="" onChange={onChange} />)
    fireEvent.change(screen.getByLabelText('價'), { target: { value: '１２a.5' } })
    expect(onChange).toHaveBeenCalledWith('12.5')
  })

  it('<NumberInput kind="digits"> 保留前導 0、給數字鍵盤', () => {
    const onChange = vi.fn()
    renderWithTheme(<NumberInput aria-label="碼" kind="digits" value="" onChange={onChange} />)
    const el = screen.getByLabelText('碼')
    expect(el.getAttribute('inputmode')).toBe('numeric')
    fireEvent.change(el, { target: { value: '０0１x' } })
    expect(onChange).toHaveBeenCalledWith('001')
  })

  it('<Input numberKind> 走同一支清洗', () => {
    let seen = ''
    renderWithTheme(<Input aria-label="末五碼" numberKind="digits" value="" onChange={e => { seen = e.target.value }} />)
    fireEvent.change(screen.getByLabelText('末五碼'), { target: { value: 'ab０１２' } })
    expect(seen).toBe('012')
  })

  it('組字中不清洗、組字結束才清（注音輸入法）', () => {
    const onChange = vi.fn()
    renderWithTheme(<NumberInput aria-label="組字" value="" onChange={onChange} />)
    const el = screen.getByLabelText('組字') as HTMLInputElement
    fireEvent.compositionStart(el)
    // 組字中的 input 事件：isComposing=true → 不可通知呼叫端
    composingInput(el, '１ㄅ')
    expect(onChange).not.toHaveBeenCalled()
    el.value = '１２．５'
    fireEvent.compositionEnd(el)
    expect(onChange).toHaveBeenCalledTimes(1)
    expect(onChange).toHaveBeenLastCalledWith('12.5')
  })

  it('<Input numberKind="integer"> 組字中不通知、結束後只給清洗值（全形不被刪、小數點之後截斷但保留點）', () => {
    const seen: string[] = []
    renderWithTheme(<Input aria-label="單價" numberKind="integer" defaultValue="" onChange={e => { seen.push(e.target.value) }} />)
    const el = screen.getByLabelText('單價') as HTMLInputElement
    fireEvent.compositionStart(el)
    composingInput(el, '１')
    expect(seen).toEqual([])
    el.value = '１２００．５'
    fireEvent.compositionEnd(el)
    expect(seen).toEqual(['1200.'])
  })
})

// 深度審查 2026-10-28 A2：呼叫端把值轉成數字（吃掉結尾的點）再回灌時，逐鍵打 1200.5 不可變成 12005
describe('integer 欄：結尾小數點在「轉數字再回灌」的呼叫端也不會被吃掉', () => {
  function type(el: HTMLInputElement, keys: string) {
    for (const ch of keys) fireEvent.change(el, { target: { value: el.value + ch } })
  }

  it('<NumberInput kind="integer">（呼叫端 replace(/\\D/g) → Number 回灌）', () => {
    let saved = 0
    function Host() {
      const [n, setN] = useState(0)
      saved = n
      return <NumberInput aria-label="價" kind="integer" value={n === 0 ? '' : String(n)}
        onChange={v => { const s = v.replace(/\D/g, ''); setN(s === '' ? 0 : Number(s)) }} />
    }
    renderWithTheme(<Host />)
    const el = screen.getByLabelText('價') as HTMLInputElement
    type(el, '1200.5')
    expect(el.value).toBe('1200.')
    expect(saved).toBe(1200)
    type(el, '0')
    expect(el.value).toBe('1200.')
  })

  it('<Input numberKind="integer">（同上）', () => {
    let saved = 0
    function Host() {
      const [n, setN] = useState(0)
      saved = n
      return <Input aria-label="額" numberKind="integer" value={n === 0 ? '' : String(n)}
        onChange={e => { const s = e.target.value.replace(/\D/g, ''); setN(s === '' ? 0 : Number(s)) }} />
    }
    renderWithTheme(<Host />)
    const el = screen.getByLabelText('額') as HTMLInputElement
    type(el, '1200.5')
    expect(el.value).toBe('1200.')
    expect(saved).toBe(1200)
  })

  it('退格刪掉點後可繼續打整數；呼叫端改值則點不殘留', () => {
    function Host() {
      const [v, setV] = useState('')
      return <><NumberInput aria-label="量" kind="integer" value={v} onChange={setV} />
        <button onClick={() => setV('7')}>重設</button></>
    }
    renderWithTheme(<Host />)
    const el = screen.getByLabelText('量') as HTMLInputElement
    type(el, '12.')
    fireEvent.change(el, { target: { value: '12' } })
    type(el, '3')
    expect(el.value).toBe('123')
    fireEvent.click(screen.getByText('重設'))
    expect(el.value).toBe('7')
  })
})
