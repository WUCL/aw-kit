// StatusMenuBadge（v0.4.0，自 inflorify 搬入）：開關、選取、disabled、Esc 只關選單（含放進 PanelHost 的對照）、IME。
import React, { useState } from 'react'
import { describe, it, expect, afterEach, vi } from 'vitest'
import { render, fireEvent, cleanup, screen, waitFor, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { installMatchMedia, routerAdapter } from './helpers.jsx'
import { PanelStackProvider, PanelHost, usePanel, usePanelStack, usePanelHeader, PanelHeaderStatus, StatusMenuBadge } from '../../src/panel/index.js'

const opts = [
  { value: 'active', label: '進行中' },
  { value: 'done', label: '已完成', disabled: true, reason: '需先付款' },
  { value: 'cancelled', label: '已取消' },
]
function Badge({ onSelect = () => {} }) {
  const [v, setV] = useState('active')
  return <div><StatusMenuBadge ariaLabel="進度" label="進行中" tone="warn" value={v} options={opts} onSelect={x => { setV(x); onSelect(x) }} /><button>外面</button></div>
}
const trigger = () => screen.getByRole('button', { name: '進度：進行中' })
afterEach(() => { cleanup(); document.body.innerHTML = ''; document.body.style.overflow = '' })

describe('StatusMenuBadge', () => {
  it('點開顯示選項；disabled 項寫出原因且點了不選；選可選項呼叫 onSelect 並關閉', () => {
    const onSelect = vi.fn()
    render(<Badge onSelect={onSelect} />)
    fireEvent.click(trigger())
    expect(screen.getByRole('menu', { name: '進度' })).toBeTruthy()
    expect(screen.getByText('需先付款')).toBeTruthy()
    expect(screen.getByRole('menuitemradio', { name: /已完成/ }).getAttribute('aria-disabled')).toBe('true')
    fireEvent.click(screen.getByRole('menuitemradio', { name: /已完成/ }))
    expect(onSelect).not.toHaveBeenCalled()
    expect(screen.getByRole('menu')).toBeTruthy()
    fireEvent.click(screen.getByRole('menuitemradio', { name: /已取消/ }))
    expect(onSelect).toHaveBeenCalledWith('cancelled')
    expect(screen.queryByRole('menu')).toBeNull()
  })
  it('aria：trigger haspopup／expanded；目前項 aria-checked；選目前值不觸發', () => {
    const onSelect = vi.fn()
    render(<Badge onSelect={onSelect} />)
    expect(trigger().getAttribute('aria-haspopup')).toBe('menu')
    expect(trigger().getAttribute('aria-expanded')).toBe('false')
    fireEvent.click(trigger())
    expect(trigger().getAttribute('aria-expanded')).toBe('true')
    expect(screen.getByRole('menuitemradio', { name: /進行中/ }).getAttribute('aria-checked')).toBe('true')
    fireEvent.click(screen.getByRole('menuitemradio', { name: /進行中/ }))
    expect(onSelect).not.toHaveBeenCalled()
  })
  it('Esc 關閉並回到按鈕；IME 組字中的 Esc 不關', () => {
    render(<Badge />)
    fireEvent.click(trigger())
    fireEvent.keyDown(document, { key: 'Escape', keyCode: 229 })
    expect(screen.queryByRole('menu')).toBeTruthy()
    fireEvent.keyDown(document, { key: 'Escape', isComposing: true })
    expect(screen.queryByRole('menu')).toBeTruthy()
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(screen.queryByRole('menu')).toBeNull()
    expect(document.activeElement).toBe(trigger())
  })
  it('鍵盤：↓ 開啟、↑↓ 跳過 disabled、Home／End；點外面關閉', () => {
    render(<Badge />)
    fireEvent.keyDown(trigger(), { key: 'ArrowDown' })
    const menu = screen.getByRole('menu')
    expect(document.activeElement).toBe(screen.getByRole('menuitemradio', { name: /進行中/ }))
    fireEvent.keyDown(menu, { key: 'ArrowDown' })
    expect(document.activeElement).toBe(screen.getByRole('menuitemradio', { name: /已取消/ }))
    fireEvent.keyDown(menu, { key: 'ArrowUp' })
    expect(document.activeElement).toBe(screen.getByRole('menuitemradio', { name: /進行中/ }))
    fireEvent.keyDown(menu, { key: 'End' })
    expect(document.activeElement).toBe(screen.getByRole('menuitemradio', { name: /已取消/ }))
    fireEvent.keyDown(menu, { key: 'Home' })
    expect(document.activeElement).toBe(screen.getByRole('menuitemradio', { name: /進行中/ }))
    fireEvent.pointerDown(screen.getByRole('button', { name: '外面' }))
    expect(screen.queryByRole('menu')).toBeNull()
  })
  it('tone 變數：data-badge 對映，舊名 success→ok', () => {
    render(<><StatusMenuBadge ariaLabel="a" label="甲" tone="success" value="x" options={[]} onSelect={() => {}} /><StatusMenuBadge ariaLabel="b" label="乙" value="x" options={[]} onSelect={() => {}} /></>)
    expect(screen.getByText('甲').closest('[data-badge]').getAttribute('data-badge')).toBe('ok')
    expect(screen.getByText('乙').closest('[data-badge]').getAttribute('data-badge')).toBe('plain')
  })
})

describe('StatusMenuBadge 在 PanelHost 內', () => {
  function Content() {
    usePanelHeader({ title: '訂單' })
    return <PanelHeaderStatus><StatusMenuBadge ariaLabel="進度" label="進行中" tone="warn" value="a" options={[{ value: 'a', label: '進行中' }, { value: 'b', label: '已取消' }]} onSelect={() => {}} /></PanelHeaderStatus>
  }
  function Depth() { return <i data-testid="depth">{usePanelStack().stack.length}</i> }
  function Opener() { const { openPanel } = usePanel(); return <button onClick={() => openPanel('c', {})}>open</button> }
  const setup = async () => {
    installMatchMedia(false, true)
    render(<MemoryRouter><PanelStackProvider router={routerAdapter}><Opener /><Depth /><PanelHost registry={{ c: { component: Content } }} /></PanelStackProvider></MemoryRouter>)
    fireEvent.click(screen.getByText('open'))
    await screen.findByRole('button', { name: '進度：進行中' })
    await new Promise(r => setTimeout(r, 120))   // 讓 SlideOver 開層的初始聚焦（60ms）先跑完
  }
  it('Esc 只關選單：面板仍在、焦點回按鈕；選單已關時再按 Esc 才關面板', async () => {
    await setup()
    const t = screen.getByRole('button', { name: '進度：進行中' })
    fireEvent.click(t)
    expect(screen.getByRole('menu')).toBeTruthy()
    fireEvent.keyDown(document.activeElement ?? document, { key: 'Escape' })
    await new Promise(r => setTimeout(r, 50))
    expect(screen.queryByRole('menu')).toBeNull()
    expect(screen.getByTestId('depth').textContent).toBe('1')
    expect(document.activeElement).toBe(t)
    fireEvent.keyDown(document, { key: 'Escape' })
    await waitFor(() => expect(screen.getByTestId('depth').textContent).toBe('0'))
  })
  it('IME 組字中的 Esc：選單與面板都不關', async () => {
    await setup()
    fireEvent.click(screen.getByRole('button', { name: '進度：進行中' }))
    fireEvent.keyDown(document.activeElement, { key: 'Escape', keyCode: 229 })
    await new Promise(r => setTimeout(r, 50))
    expect(screen.queryByRole('menu')).toBeTruthy()
    expect(screen.getByTestId('depth').textContent).toBe('1')
  })
})
