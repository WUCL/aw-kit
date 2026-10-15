// 面板 × 瀏覽器歷史：上一頁＝關最上層、不改網址。實際 router 為 data router（createBrowserRouter），這裡用 createMemoryRouter（同一套 navigate／POP／state 行為）。
import React from 'react'
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest'
import { render, fireEvent, cleanup, screen, waitFor, act, within } from '@testing-library/react'
import { createMemoryRouter, RouterProvider, useLocation, useNavigate } from 'react-router-dom'
import { installMatchMedia, routerAdapter } from './helpers.jsx'
import { PanelStackProvider, PanelHost, usePanel, usePanelStack, usePanelCloseGuard } from '../../src/panel/index.js'

let guard = () => true
const onClosed = vi.fn()

function Content({ seed, openPanel, closeAll }) {
  usePanelCloseGuard(() => guard())
  return (
    <div>
      <span>layer-{seed.n}</span>
      <button onClick={() => openPanel('c', { n: seed.n + 1 })}>open-next</button>
      <button onClick={closeAll}>do-closeAll</button>
    </div>
  )
}
const registry = { c: { component: Content, ariaLabel: '測試面板' } }

function Page() {
  const { openPanel } = usePanel()
  const nav = useNavigate()
  const loc = useLocation()
  const depth = usePanelStack().stack.length
  return (
    <div>
      <i data-testid="depth">{depth}</i><i data-testid="url">{loc.pathname + loc.search}</i>
      <button onClick={() => openPanel('c', { n: 1 })}>open-first</button>
      <button onClick={() => openPanel('c', { n: 1 }, { ownsHistory: false, onClosed })}>open-url-layer</button>
      <button onClick={() => nav('/other')}>go-other</button>
      <button onClick={() => nav('/?tx=1')}>push-tx</button>
    </div>
  )
}
function Shell() { return (<PanelStackProvider router={routerAdapter}><Page /><PanelHost registry={registry} /></PanelStackProvider>) }

let router
function setup() {
  installMatchMedia(false)
  router = createMemoryRouter([{ path: '*', element: <Shell /> }], { initialEntries: ['/'] })
  render(<RouterProvider router={router} />)
}
const depth = () => Number(screen.getByTestId('depth').textContent)
const url = () => screen.getByTestId('url').textContent
const back = async () => { await act(async () => { await router.navigate(-1) }) }
const idx = () => router.state.historyAction && window && router.state.location.key
async function openN(n) {
  fireEvent.click(screen.getByText('open-first')); await screen.findByText('layer-1')
  for (let i = 2; i <= n; i++) { fireEvent.click(topW().getByText('open-next')); await screen.findByText(`layer-${i}`) }
}
// 下層保持掛載、帶 aria-hidden，getByRole 只回最上層
const topW = () => within(screen.getByRole('dialog'))
const esc = () => fireEvent.keyDown(document, { key: 'Escape', code: 'Escape', keyCode: 27 })
const settle = () => act(async () => { await new Promise(r => setTimeout(r, 400)) })

beforeEach(() => { guard = () => true; onClosed.mockClear() })
afterEach(() => { cleanup(); document.body.innerHTML = '' })

describe('上一頁＝關最上層', () => {
  it('開兩層不改網址；上一頁關一層、再一次關第二層、第三次回前頁', async () => {
    setup(); await openN(2)
    expect(url()).toBe('/')
    await back(); await waitFor(() => expect(depth()).toBe(1))
    await back(); await waitFor(() => expect(depth()).toBe(0))
    expect(url()).toBe('/')
    // 已回到最底紀錄：再上一頁沒有東西可退（memory history 無前頁），堆疊維持 0
    expect(router.state.historyAction).toBe('POP')
  })
  it('連按兩次上一頁（不等動畫）關兩層', async () => {
    setup(); await openN(2)
    await back(); await back()
    await waitFor(() => expect(depth()).toBe(0))
  })
  it('守門拒絕：層不關、紀錄補回；再按上一頁仍會問', async () => {
    let calls = 0
    setup(); await openN(2)
    guard = () => { calls++; return false }
    await back()
    await waitFor(() => expect(calls).toBe(1))
    await settle()
    expect(depth()).toBe(2)
    await back()
    await waitFor(() => expect(calls).toBe(2))
    await settle()
    expect(depth()).toBe(2)
    // 之後放行：真的能關
    guard = () => true
    await back(); await waitFor(() => expect(depth()).toBe(1))
  })
  it('✕／Esc 關一層走 navigate(-1)：之後按上一頁不會多關一層', async () => {
    setup(); await openN(2)
    esc()
    await waitFor(() => expect(depth()).toBe(1))
    expect(screen.getByText('layer-1')).toBeTruthy()
    await back()   // 這次才關第一層
    await waitFor(() => expect(depth()).toBe(0))
  })
  it('closeAll（內容呼叫）退掉所有自己的紀錄：之後上一頁不會落在殘留的面板紀錄', async () => {
    setup(); await openN(3)
    fireEvent.click(topW().getByText('do-closeAll'))
    await waitFor(() => expect(depth()).toBe(0), { timeout: 1500 })
    expect(router.state.location.state).toBeNull()
  })
  it('連點兩次關閉（旗標）：只退一層', async () => {
    setup(); await openN(3)
    // 讓 navigate(-1) 延後 100ms 才真的執行，製造「守門已放行、POP 尚未處理」的空檔，期間再按一次關閉
    const real = router.navigate.bind(router)
    const spy = vi.spyOn(router, 'navigate').mockImplementation(((to) => new Promise(r => setTimeout(() => { void real(to); r() }, 100))))
    esc()
    await act(async () => { await new Promise(r => setTimeout(r, 30)) })
    esc()
    await act(async () => { await new Promise(r => setTimeout(r, 30)) })
    expect(spy.mock.calls.filter(c => c[0] === -1)).toHaveLength(1)
    await waitFor(() => expect(depth()).toBe(2))
    await settle()
    expect(depth()).toBe(2)
  })
})

describe('ownsHistory:false（頁面帶網址的第一層）', () => {
  it('不額外推紀錄；子層推一筆；上一頁關子層留第一層；再關第一層呼叫 onClosed', async () => {
    setup()
    fireEvent.click(screen.getByText('push-tx')); await waitFor(() => expect(url()).toBe('/?tx=1'))
    fireEvent.click(screen.getByText('open-url-layer')); await screen.findByText('layer-1')
    const keyBefore = router.state.location.key
    expect(router.state.location.state).toBeNull()   // 沒推紀錄
    fireEvent.click(topW().getByText('open-next')); await screen.findByText('layer-2')
    expect(router.state.location.state).toEqual({ awPanel: 2 })
    await back(); await waitFor(() => expect(depth()).toBe(1))
    expect(router.state.location.key).toBe(keyBefore)
    expect(onClosed).not.toHaveBeenCalled()
    esc()   // 第一層：✕ 無紀錄 → 直接關並通知頁面
    await waitFor(() => expect(depth()).toBe(0), { timeout: 1500 })
    expect(onClosed).toHaveBeenCalledTimes(1)
  })
  it('頁面 push ?tx 後才在 effect 開層：不會被 PUSH→closeAll 立刻關掉', async () => {
    setup()
    fireEvent.click(screen.getByText('push-tx'))
    await waitFor(() => expect(url()).toBe('/?tx=1'))
    fireEvent.click(screen.getByText('open-url-layer')); await screen.findByText('layer-1')
    expect(depth()).toBe(1)
  })
})

describe('整頁跳轉', () => {
  it('開著兩層 PUSH 到別頁：堆疊清空；上一頁回原頁時快照還原兩層、再上一頁逐層關，不會停在同一頁什麼都沒發生', async () => {
    setup(); await openN(2)
    fireEvent.click(screen.getByText('go-other'))
    await waitFor(() => expect(url()).toBe('/other'))
    await waitFor(() => expect(depth()).toBe(0))
    await back()
    await waitFor(() => expect(url()).toBe('/'))
    await waitFor(() => expect(depth()).toBe(2))
    await back(); await waitFor(() => expect(depth()).toBe(1))
    await back(); await waitFor(() => expect(depth()).toBe(0))
  })
  it('下一頁（forward）走進已關掉層的舊紀錄：自動退回，不憑空重開', async () => {
    setup(); await openN(1)
    await back(); await waitFor(() => expect(depth()).toBe(0))
    await act(async () => { await router.navigate(1) })
    await waitFor(() => expect(router.state.location.state).toBeNull())
    expect(depth()).toBe(0)
  })
})
