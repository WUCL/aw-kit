// 翻案 ⑧：每層一個 SlideOver、全部保留掛載。
// 舊寫法（單殼只畫最上層、換層卸載下層）下，「下層仍在 DOM／分頁與輸入保留」「z-index 成對」「點露出區關一層」這些斷言全部會紅。
import React, { useState } from 'react'
import { describe, it, expect, afterEach } from 'vitest'
import { render, fireEvent, cleanup, screen, waitFor, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { installMatchMedia, routerAdapter } from './helpers.jsx'
import { desktopWidth } from '../../src/panel/SlideOver.jsx'
import { PanelStackProvider, PanelHost, usePanel, usePanelStack, MAX_DEPTH } from '../../src/panel/index.js'

// inknock's Z ladder values the assertions refer to (theme.ts Z.panelHost/menu/modal); aw-kit's default zBase is 160.
const Z = { panelHost: 160, menu: 200, modal: 500 }

function Content({ seed, openPanel }) {
  const [tab, setTab] = useState('a')
  const [text, setText] = useState('')
  return (
    <div>
      <span>layer-{seed.n}</span>
      <button onClick={() => setTab('b')}>tab-b-{seed.n}</button>
      <i data-testid={`tab-${seed.n}`}>{tab}</i>
      <input aria-label={`input-${seed.n}`} value={text} onChange={e => setText(e.target.value)} />
      <button onClick={() => openPanel('c', { n: seed.n + 1 })}>open-next-{seed.n}</button>
    </div>
  )
}
const registry = { c: { component: Content, ariaLabel: '測試面板' } }
function Depth() { return <i data-testid="depth">{usePanelStack().stack.length}</i> }
function Opener() { const { openPanel } = usePanel(); return <button onClick={() => openPanel('c', { n: 1 })}>open-first</button> }
function setup(mobile = false) {
  installMatchMedia(mobile)
  render(<MemoryRouter><PanelStackProvider router={routerAdapter}><Opener /><Depth /><PanelHost registry={registry} /></PanelStackProvider></MemoryRouter>)
}
const depth = () => Number(screen.getByTestId('depth').textContent)
const esc = () => fireEvent.keyDown(document, { key: 'Escape', code: 'Escape', keyCode: 27 })
const allDialogs = () => [...document.querySelectorAll('[role="dialog"]')]
async function open(n) {
  fireEvent.click(screen.getByText('open-first')); await screen.findByText('layer-1')
  for (let i = 2; i <= n; i++) { fireEvent.click(screen.getByText(`open-next-${i - 1}`)); await screen.findByText(`layer-${i}`) }
}
afterEach(() => { cleanup(); document.body.innerHTML = ''; document.body.style.overflow = '' })

describe('下層保持掛載', () => {
  it('疊兩層：下層仍在 DOM；返回後分頁與輸入還在（同一個節點，沒重掛）', async () => {
    setup()
    fireEvent.click(screen.getByText('open-first')); await screen.findByText('layer-1')
    fireEvent.click(screen.getByText('tab-b-1'))
    fireEvent.change(screen.getByLabelText('input-1'), { target: { value: '草稿' } })
    const input1 = screen.getByLabelText('input-1')
    fireEvent.click(screen.getByText('open-next-1')); await screen.findByText('layer-2')
    expect(screen.getByText('layer-1')).toBeTruthy()              // 下層沒卸載
    expect(screen.getByTestId('tab-1').textContent).toBe('b')
    esc()
    await waitFor(() => expect(depth()).toBe(1))
    await waitFor(() => expect(screen.queryByText('layer-2')).toBeNull())
    expect(screen.getByLabelText('input-1')).toBe(input1)
    expect(screen.getByLabelText('input-1').value).toBe('草稿')
    expect(screen.getByTestId('tab-1').textContent).toBe('b')
  })
  it('關上層：滑出動畫期間仍在 DOM（ghost），跑完才卸載', async () => {
    setup(); await open(2)
    esc()
    await waitFor(() => expect(depth()).toBe(1))
    expect(screen.queryByText('layer-2')).toBeTruthy()            // 滑出中
    await waitFor(() => expect(screen.queryByText('layer-2')).toBeNull())
  })
})

describe('只有最上層是作用中的對話框', () => {
  it('下層 inert＋aria-hidden＋無 aria-modal；只有最上層帶 aria-modal', async () => {
    setup(); await open(3)
    const ds = allDialogs()
    expect(ds).toHaveLength(3)
    expect(ds.map(d => d.getAttribute('aria-modal'))).toEqual([null, null, 'true'])
    const wrappers = ds.map(d => d.parentElement)
    expect(wrappers.map(w => w.hasAttribute('inert'))).toEqual([true, true, false])
    expect(wrappers.map(w => w.getAttribute('aria-hidden'))).toEqual(['true', 'true', null])
    expect(screen.getAllByRole('dialog')).toHaveLength(1)           // a11y tree 只剩最上層
  })
  it('Esc 一次只關最上層一層（連按才逐層關），不是全關', async () => {
    setup(); await open(3)
    esc(); await waitFor(() => expect(depth()).toBe(2))
    await new Promise(r => setTimeout(r, 50))
    expect(depth()).toBe(2)
    esc(); await waitFor(() => expect(depth()).toBe(1))
  })
})

describe('點下層露出的部分＝點最上層遮罩＝只關最上層', () => {
  it('點最上層遮罩關一層、下層留著', async () => {
    setup(); await open(2)
    const top = screen.getByRole('dialog')
    const backdrop = top.parentElement.firstElementChild
    fireEvent.click(backdrop)
    await waitFor(() => expect(depth()).toBe(1))
    expect(screen.getByText('layer-1')).toBeTruthy()
  })
  it('下層的遮罩點不到（inert 層不回應）', async () => {
    setup(); await open(2)
    const lower = allDialogs()[0]
    fireEvent.click(lower.parentElement.firstElementChild)
    await new Promise(r => setTimeout(r, 50))
    expect(depth()).toBe(2)
  })
})

describe('z-index 成對遞增、桌機縮寬、body 捲動鎖', () => {
  it('每層 遮罩=panelHost+2d、面板=+1；上層遮罩必蓋過下層面板；8 層仍低於 menu、Modal 在最上', async () => {
    setup(); await open(MAX_DEPTH)
    const ds = allDialogs()
    expect(ds).toHaveLength(MAX_DEPTH)
    ds.forEach((d, i) => {
      expect(Number(d.parentElement.style.zIndex)).toBe(Z.panelHost + i * 2)
      expect(Number(d.style.zIndex)).toBe(Z.panelHost + i * 2 + 1)
      if (i > 0) expect(Number(d.parentElement.style.zIndex)).toBeGreaterThan(Number(ds[i - 1].style.zIndex))
    })
    expect(Number(ds[MAX_DEPTH - 1].style.zIndex)).toBeLessThan(Z.menu)
    expect(Z.modal).toBeGreaterThan(Number(ds[MAX_DEPTH - 1].style.zIndex))
  })
  it('第一層完整寬度，第二層起固定縮 7%（不逐層加深）；手機同規則', async () => {
    expect([0, 1, 2, 5].map(i => desktopWidth(500, i))).toEqual(['500px', 'max(360px, calc(500px * 0.93))', 'max(360px, calc(500px * 0.93))', 'max(360px, calc(500px * 0.93))'])
    setup(true); await open(3)
    const ws = allDialogs().map(d => d.style.width)
    expect(ws[0]).toBe('calc(100% - 40px)')
    expect(ws.slice(1)).toEqual(['calc(0.93 * calc(100% - 40px))', 'calc(0.93 * calc(100% - 40px))'])  // jsdom 會把 calc 正規化成係數在前
  })
  it('body 捲動鎖只鎖一次：第一層開時鎖、全關完還原', async () => {
    document.body.style.overflow = 'auto'
    setup(); await open(3)
    expect(document.body.style.overflow).toBe('hidden')
    esc(); await waitFor(() => expect(depth()).toBe(2))
    await new Promise(r => setTimeout(r, 400))
    expect(document.body.style.overflow).toBe('hidden')           // 還有兩層
    esc(); await waitFor(() => expect(depth()).toBe(1))
    esc(); await waitFor(() => expect(depth()).toBe(0))
    await waitFor(() => expect(document.body.style.overflow).toBe('auto'))
  })
})

describe('焦點', () => {
  it('開新層焦點移到新層；關層還原到下層原焦點元素', async () => {
    setup()
    fireEvent.click(screen.getByText('open-first')); await screen.findByText('layer-1')
    const btn = screen.getByText('open-next-1')
    btn.focus()
    fireEvent.click(btn); await screen.findByText('layer-2')
    await waitFor(() => expect(within(screen.getByRole('dialog')).getByText('layer-2').closest('[role="dialog"]').contains(document.activeElement)).toBe(true))
    esc(); await waitFor(() => expect(screen.queryByText('layer-2')).toBeNull())
    expect(document.activeElement).toBe(btn)
  })
})
