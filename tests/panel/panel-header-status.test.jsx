// PanelHeaderStatus（v0.4.0）：標頭第三列「狀態列」，內容以 portal 畫進所屬層 header。
import React, { useRef } from 'react'
import { describe, it, expect, afterEach } from 'vitest'
import { render, fireEvent, cleanup, screen, waitFor, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { installMatchMedia, routerAdapter } from './helpers.jsx'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { PanelStackProvider, PanelHost, usePanel, usePanelHeader, PanelHeaderStatus } from '../../src/panel/index.js'

// vitest 把 styles.css?raw 轉成空字串，所以直接讀檔注入真實樣式表（jsdom 會套用 :empty／display）
function injectStyles() {
  const el = document.createElement('style')
  el.textContent = readFileSync(resolve(process.cwd(), 'src/panel/styles.css'), 'utf8')
  document.head.appendChild(el)
}

let renders = 0
function Content({ seed, openPanel }) {
  usePanelHeader({ title: `標題${seed.n}` })
  const [, force] = React.useReducer(n => n + 1, 0)
  renders++
  return (
    <div>
      {seed.status && <PanelHeaderStatus><button>狀態{seed.n}</button><span>交貨日{seed.n}</span></PanelHeaderStatus>}
      <button onClick={() => openPanel('c', { n: seed.n + 1, status: true })}>open-next</button>
      <button onClick={force}>rerender</button>
    </div>
  )
}
const registry = { c: { component: Content } }
function Opener({ status }) { const { openPanel } = usePanel(); return <button onClick={() => openPanel('c', { n: 1, status })}>open-first</button> }
function setup(status = true) {
  installMatchMedia(false, true)
  render(<MemoryRouter><PanelStackProvider router={routerAdapter}><Opener status={status} /><PanelHost registry={registry} /></PanelStackProvider></MemoryRouter>)
  fireEvent.click(screen.getByText('open-first'))
}
const header = (dlg) => dlg.querySelector('header')
afterEach(() => { cleanup(); document.body.innerHTML = ''; document.head.innerHTML = ''; renders = 0 })

describe('PanelHeaderStatus', () => {
  it('① 內容出現在該層 <header> 內、標題之後', async () => {
    setup(true)
    const h = await screen.findByRole('heading', { name: '標題1' })
    const hdr = header(screen.getByRole('dialog'))
    const btn = await within(hdr).findByText('狀態1')
    expect(hdr.contains(btn)).toBe(true)
    expect(h.compareDocumentPosition(btn) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    // 在 content 區（header 外）不應有它
    expect(screen.getAllByText('狀態1')).toHaveLength(1)
  })
  it('② 沒有 PanelHeaderStatus 時容器為空、套用預設樣式後 display:none（不佔版面）', async () => {
    injectStyles()
    setup(false)
    await screen.findByRole('heading', { name: '標題1' })
    const box = header(screen.getByRole('dialog')).querySelector('.aw-panel-status')
    expect(box).toBeTruthy()
    expect(box.childNodes.length).toBe(0)
    expect(getComputedStyle(box).display).toBe('none')
  })
  it('②b 有內容時容器 flex 顯示', async () => {
    injectStyles()
    setup(true)
    await screen.findByText('狀態1')
    const box = header(screen.getByRole('dialog')).querySelector('.aw-panel-status')
    expect(getComputedStyle(box).display).toBe('flex')
  })
  it('③ 兩層時各自在各自的 header（下層狀態列保留）', async () => {
    setup(true)
    await screen.findByText('狀態1')
    fireEvent.click(within(screen.getAllByRole('dialog')[0]).getByText('open-next'))
    await screen.findByText('狀態2')
    const dialogs = document.querySelectorAll('[role="dialog"]')
    expect(dialogs.length).toBe(2)
    const [d1, d2] = dialogs
    expect(within(header(d1)).getByText('狀態1')).toBeTruthy()
    expect(within(header(d1)).queryByText('狀態2')).toBeNull()
    expect(within(header(d2)).getByText('狀態2')).toBeTruthy()
    expect(within(header(d2)).queryByText('狀態1')).toBeNull()
  })
  it('④ PanelHost 之外 inline render，不丟錯', () => {
    render(<div data-testid="x"><PanelHeaderStatus><b>inline</b></PanelHeaderStatus></div>)
    expect(within(screen.getByTestId('x')).getByText('inline')).toBeTruthy()
  })
  it('⑤ 內容多次 re-render 不造成無限 render', async () => {
    setup(true)
    await screen.findByText('狀態1')
    await new Promise(r => setTimeout(r, 50))
    const base = renders
    expect(base).toBeLessThan(10)
    for (let i = 0; i < 3; i++) fireEvent.click(screen.getByText('rerender'))
    await new Promise(r => setTimeout(r, 50))
    expect(renders).toBe(base + 3)
    expect(screen.getAllByText('狀態1')).toHaveLength(1)
  })
})
