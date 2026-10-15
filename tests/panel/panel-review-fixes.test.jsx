// code-review 對新殼的 5 項發現的實證與回歸：URL 第一層上一頁守門、疊層不問下層守門（翻案 ⑧）、返回快照重複、closeAll 被忽略後殼可操作、下層捲動保留。
import React, { useEffect, useState } from 'react'
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest'
import { render, fireEvent, cleanup, screen, waitFor, act, within } from '@testing-library/react'
import { createMemoryRouter, RouterProvider, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { installMatchMedia, routerAdapter } from './helpers.jsx'
import { PanelStackProvider, PanelHost, usePanelStack, usePanelCloseGuard, useUrlPanel } from '../../src/panel/index.js'

let guard = () => true
let guardCalls = 0

function Content({ seed, openPanel, back, closeAll }) {
  usePanelCloseGuard(() => { guardCalls++; return guard() })
  const [loaded, setLoaded] = useState(false)
  useEffect(() => { const t = setTimeout(() => setLoaded(true), 120); return () => clearTimeout(t) }, [])
  return (
    <div data-testid={`content-${seed.n}`} data-loaded={loaded ? '1' : '0'}>
      <span>layer-{seed.n}</span>
      <button onClick={() => openPanel('c', { n: seed.n + 1 })}>open-next</button>
      <button onClick={back}>do-back</button>
      <button onClick={closeAll}>do-closeAll</button>
    </div>
  )
}
const registry = { c: { component: Content, ariaLabel: '測試面板' } }

function UrlPage({ delay }) {
  const [sp, setSp] = useSearchParams()
  const tx = sp.get('tx')
  const [ready, setReady] = useState(delay === 0)
  useEffect(() => { if (!delay) return; const t = setTimeout(() => setReady(true), delay); return () => clearTimeout(t) }, [delay])
  useUrlPanel('c', tx && ready ? { key: tx, seed: { n: 1 } } : null, () => setSp({}, { replace: true }))
  return null
}
let urlDelay = 0
function Controls() {
  const nav = useNavigate()
  const loc = useLocation()
  const depth = usePanelStack().stack.length
  return (
    <div>
      <i data-testid="depth">{depth}</i><i data-testid="url">{loc.pathname + loc.search}</i>
      <button onClick={() => nav('/?tx=1')}>push-tx</button>
      <button onClick={() => nav('/other')}>go-other</button>
      {loc.pathname === '/' && <UrlPage delay={urlDelay} />}
    </div>
  )
}
let router
function setup() {
  installMatchMedia(false)
  router = createMemoryRouter([{ path: '*', element: <PanelStackProvider router={routerAdapter}><Controls /><PanelHost registry={registry} /></PanelStackProvider> }], { initialEntries: ['/'] })
  render(<RouterProvider router={router} />)
}
const topW = () => within(screen.getByRole('dialog'))
const depth = () => Number(screen.getByTestId('depth').textContent)
const url = () => screen.getByTestId('url').textContent
const back = async () => { await act(async () => { await router.navigate(-1) }) }
const settle = (ms = 500) => act(async () => { await new Promise(r => setTimeout(r, ms)) })

beforeEach(() => { guard = () => true; guardCalls = 0; urlDelay = 0 })
afterEach(() => { cleanup(); document.body.innerHTML = ''; vi.restoreAllMocks() })

describe('1. 網址開的第一層按上一頁要過守門', () => {
  it('守門拒絕：面板留著、守門被問過、?tx 補回', async () => {
    guard = () => false
    setup()
    fireEvent.click(screen.getByText('push-tx')); await screen.findByText('layer-1')
    await back()
    await settle()
    expect(guardCalls).toBeGreaterThan(0)
    expect(depth()).toBe(1)
    expect(url()).toBe('/?tx=1')
  })
  it('守門通過：面板關、?tx 不在', async () => {
    setup()
    fireEvent.click(screen.getByText('push-tx')); await screen.findByText('layer-1')
    await back()
    await waitFor(() => expect(depth()).toBe(0), { timeout: 1500 })
    expect(url()).toBe('/')
  })
  it('拒絕後再放行：再按上一頁真的能關', async () => {
    guard = () => false
    setup()
    fireEvent.click(screen.getByText('push-tx')); await screen.findByText('layer-1')
    await back(); await settle()
    expect(depth()).toBe(1)
    guard = () => true
    await back()
    await waitFor(() => expect(depth()).toBe(0), { timeout: 1500 })
  })
})

describe('2. 疊新層不問下層守門（翻案 ⑧：下層不卸載、資料不會丟）', () => {
  it('下層守門回 false 也照開，且守門沒被問、下層仍在 DOM', async () => {
    setup()
    fireEvent.click(screen.getByText('push-tx')); await screen.findByText('layer-1')
    guard = () => false
    fireEvent.click(topW().getByText('open-next'))
    await screen.findByText('layer-2')
    expect(guardCalls).toBe(0)
    expect(screen.getByText('layer-1')).toBeTruthy()
    expect(depth()).toBe(2)
  })
  it('守門通過：照開', async () => {
    setup()
    fireEvent.click(screen.getByText('push-tx')); await screen.findByText('layer-1')
    fireEvent.click(topW().getByText('open-next'))
    await screen.findByText('layer-2')
    expect(depth()).toBe(2)
  })
})

describe('3. 網址第一層＋疊層 → 整頁跳轉 → 上一頁：每層只有一份、?tx 仍在', () => {
  for (const delay of [0, 80]) {
    it(`頁面 ${delay}ms 後才依 param 開第一層`, async () => {
      urlDelay = delay
      setup()
      fireEvent.click(screen.getByText('push-tx')); await screen.findByText('layer-1')
      fireEvent.click(topW().getByText('open-next')); await screen.findByText('layer-2')
      fireEvent.click(screen.getByText('go-other'))
      await waitFor(() => expect(url()).toBe('/other'))
      await waitFor(() => expect(depth()).toBe(0))
      await back()
      await settle(600)
      expect(url()).toBe('/?tx=1')
      expect(depth()).toBe(2)
      expect(screen.getAllByText(/layer-/).map(e => e.textContent).sort()).toEqual(['layer-1', 'layer-2'])   // 兩層各一份
      await back()
      await waitFor(() => expect(depth()).toBe(1))
      await waitFor(() => expect(screen.getAllByText(/layer-/)).toHaveLength(1))
      expect(screen.getByText('layer-1')).toBeTruthy()
      expect(url()).toBe('/?tx=1')
    })
  }
})

describe('4. closeAll 在返回進行中被忽略，最終狀態一致', () => {
  it('殼不停在 show=false（仍可操作）', async () => {
    setup()
    fireEvent.click(screen.getByText('push-tx')); await screen.findByText('layer-1')
    fireEvent.click(topW().getByText('open-next')); await screen.findByText('layer-2')
    const real = router.navigate.bind(router)
    vi.spyOn(router, 'navigate').mockImplementation(((to) => new Promise(r => setTimeout(() => { void real(to); r() }, 700))))
    fireEvent.click(topW().getByText('do-back'))     // 返回進行中（navigate 延後）
    await act(async () => { await new Promise(r => setTimeout(r, 80)) })   // 守門讓出期過後、POP 尚未到
    fireEvent.click(topW().getByText('do-closeAll'))  // closeAll 在返回進行中被忽略
    await settle(1500)
    expect(depth()).toBe(1)
    const dlg = screen.getByRole('dialog')
    expect(dlg.style.transform).toMatch(/translateX\(0(px)?\)/)
  })
})

describe('5. 下層保持掛載：捲動位置與輸入自然保留（無需還原邏輯）', () => {
  it('第一層捲到 500、疊第二層、返回：同一個 DOM 節點、捲動仍是 500', async () => {
    // jsdom 的 scrollTop 不會記值：用 store 模擬
    const store = new WeakMap()
    Object.defineProperty(HTMLElement.prototype, 'scrollTop', {
      configurable: true,
      get() { return store.get(this) ?? 0 },
      set(v) { store.set(this, v) },
    })
    try {
      setup()
      fireEvent.click(screen.getByText('push-tx')); await screen.findByText('layer-1')
      const dlg1 = screen.getByRole('dialog')
      dlg1.scrollTop = 500
      const marker = screen.getByTestId('content-1')
      fireEvent.click(topW().getByText('open-next')); await screen.findByText('layer-2')
      expect(screen.getByTestId('content-1')).toBe(marker)   // 沒有被卸載重掛
      fireEvent.click(topW().getByText('do-back'))
      await waitFor(() => expect(depth()).toBe(1))
      await waitFor(() => expect(screen.getAllByText(/layer-/)).toHaveLength(1))
      expect(screen.getByRole('dialog')).toBe(dlg1)
      expect(screen.getByRole('dialog').scrollTop).toBe(500)
      expect(screen.getByTestId('content-1')).toBe(marker)
    } finally {
      delete HTMLElement.prototype.scrollTop
    }
  })
})
