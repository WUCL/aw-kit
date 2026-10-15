// 上線前 code-review 第二輪（A–H）：每項先紅後綠。
import React from 'react'
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest'
import { render, fireEvent, cleanup, screen, waitFor, act, within } from '@testing-library/react'
import { createMemoryRouter, RouterProvider, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { installMatchMedia, routerAdapter } from './helpers.jsx'
import { PanelStackProvider, PanelHost, usePanel, usePanelStack, usePanelCloseGuard, usePanelHeader, useUrlPanel } from '../../src/panel/index.js'
import { isPanelOnlyNavigation } from '../../src/panel/panel-navigation.js'
import { useBlocker } from 'react-router-dom'

// Test double of inknock's UnsavedChangesGuard (same useBlocker + isPanelOnlyNavigation shouldBlock), minus the Modal UI.
function UnsavedChangesGuard({ when, message }) {
  const blocker = useBlocker(({ currentLocation, nextLocation }) => when && !isPanelOnlyNavigation(currentLocation, nextLocation))
  return blocker.state === 'blocked' ? <div>{message}</div> : null
}

let guard = () => true
let dirty = false

function Content({ seed, openPanel, closeAll }) {
  usePanelCloseGuard(() => guard())
  usePanelHeader({ title: seed.title ?? `T${seed.n}` })
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
  const [sp, setSp] = useSearchParams()
  const id = sp.get('d')
  const [dirtyState, setDirtyState] = React.useState(false)
  useUrlPanel('c', id ? { key: id, seed: { n: 1, title: `D-${id}` } } : null, () => setSp(p => { p.delete('d'); return p }, { replace: true }))
  return (
    <div>
      <UnsavedChangesGuard when={dirty || dirtyState} message="BLOCKED-DIALOG" />
      <i data-testid="depth">{depth}</i><i data-testid="url">{loc.pathname + loc.search}</i>
      <button onClick={() => openPanel('c', { n: 1 })}>open-first</button>
      <button onClick={() => setDirtyState(true)}>make-dirty</button>
      <button onClick={() => nav('/other')}>go-other</button>
      <button onClick={() => nav('/list')}>go-list</button>
      <button onClick={() => nav('/?d=a')}>open-a</button>
      <button onClick={() => setSp(p => { p.set('tab', 'x'); return p }, { replace: true })}>replace-tab</button>
      <button onClick={() => setSp(p => { p.delete('d'); return p }, { replace: true })}>page-remove-param</button>
    </div>
  )
}
function Shell() { return (<PanelStackProvider router={routerAdapter}><Page /><PanelHost registry={registry} /></PanelStackProvider>) }

let router
function setup(entries = ['/']) {
  installMatchMedia(false)
  router = createMemoryRouter([{ path: '*', element: <Shell /> }], { initialEntries: entries })
  render(<RouterProvider router={router} />)
}
const depth = () => Number(screen.getByTestId('depth').textContent)
const url = () => screen.getByTestId('url').textContent
const back = async () => { await act(async () => { await router.navigate(-1) }) }
const topW = () => within(screen.getByRole('dialog'))
const settle = () => act(async () => { await new Promise(r => setTimeout(r, 400)) })

beforeEach(() => { guard = () => true; dirty = false })
afterEach(() => { cleanup(); document.body.innerHTML = '' })

describe('A. 路由攔截不攔面板自身移動', () => {
  const L = (pathname, search = '', awPanel) => ({ pathname, search, hash: '', state: awPanel === undefined ? null : { awPanel }, key: 'k' })
  it('isPanelOnlyNavigation：同 path＋search 且 awPanel 不同才算', () => {
    expect(isPanelOnlyNavigation(L('/a', '?x=1', 0), L('/a', '?x=1', 1))).toBe(true)
    expect(isPanelOnlyNavigation(L('/a', '', 2), L('/a', '', 1))).toBe(true)
    expect(isPanelOnlyNavigation(L('/a'), L('/b'))).toBe(false)
    expect(isPanelOnlyNavigation(L('/a', '?x=1'), L('/a', '?x=2', 1))).toBe(false)
    expect(isPanelOnlyNavigation(L('/a'), L('/a'))).toBe(false)
  })
  it('頁面 dirty 時開面板、關面板都不跳離開確認；navigate(-1) 沒越過本頁', async () => {
    dirty = true
    setup()
    fireEvent.click(screen.getByText('open-first')); await screen.findByText('layer-1')
    expect(screen.queryByText('BLOCKED-DIALOG')).toBeNull()
    fireEvent.click(topW().getByText('do-closeAll'))
    await waitFor(() => expect(depth()).toBe(0))
    expect(screen.queryByText('BLOCKED-DIALOG')).toBeNull()
    expect(url()).toBe('/')
    // 真的整頁離開仍要攔
    fireEvent.click(screen.getByText('go-other'))
    await screen.findByText('BLOCKED-DIALOG')
  })
})

describe('7/8. 班表式流程：頁面 dirty＋面板守門確認放棄，按 ✕ 只問一次、網址正確回列表', () => {
  it('不靠 leaving 旗標與 32ms 讓出也成立', async () => {
    const asked = vi.fn()
    setup(['/list'])
    fireEvent.click(screen.getByText('go-list'))   // 同頁 noop，確保 router 起來
    act(() => { void router.navigate('/list?d=a') })
    await screen.findByText('layer-1')
    fireEvent.click(screen.getByText('make-dirty'))
    guard = () => { asked(); return true }   // 使用者在確認框選「確定離開」
    fireEvent.click(topW().getByLabelText('關閉'))
    await waitFor(() => expect(depth()).toBe(0))
    expect(asked).toHaveBeenCalledTimes(1)
    expect(screen.queryByText('BLOCKED-DIALOG')).toBeNull()
    expect(url()).toBe('/list')
  })
})

describe('B. 跨頁 POP 清堆疊前先問守門', () => {
  async function toDetail() {
    setup(['/list'])
    act(() => { void router.navigate('/detail?d=a') })
    await screen.findByText('layer-1')
  }
  it('守門拒絕：面板留著、網址補回原頁', async () => {
    const asked = vi.fn()
    await toDetail()
    guard = () => { asked(); return false }
    await back()
    await waitFor(() => expect(asked).toHaveBeenCalledTimes(1))
    await settle()
    expect(depth()).toBe(1)
    expect(url()).toBe('/detail?d=a')
  })
  it('守門通過：關面板、回到列表', async () => {
    const asked = vi.fn()
    await toDetail()
    guard = () => { asked(); return true }
    await back()
    await waitFor(() => expect(depth()).toBe(0))
    expect(asked).toHaveBeenCalledTimes(1)
    expect(url()).toBe('/list')
  })
})

describe('C. 跨頁 POP 關掉 URL 層後，再點同一筆能重新開', () => {
  it('Back 到 /list 再開 ?d=a：面板再開', async () => {
    setup(['/list'])
    act(() => { void router.navigate('/detail?d=a') })
    await screen.findByText('layer-1')
    await back()
    await waitFor(() => expect(depth()).toBe(0))
    await settle()
    fireEvent.click(screen.getByText('open-a'))
    await waitFor(() => expect(depth()).toBe(1))
  })
})

describe('D. URL 層開啟後頁面 replace 改 search，上一頁只關最上層', () => {
  it('?d=a 開層 → replace 加 &tab=x → 開第二層 → 上一頁：留第一層', async () => {
    setup(['/'])
    fireEvent.click(screen.getByText('open-a')); await screen.findByText('layer-1')
    fireEvent.click(screen.getByText('replace-tab'))
    await waitFor(() => expect(url()).toBe('/?d=a&tab=x'))
    fireEvent.click(topW().getByText('open-next')); await screen.findByText('layer-2')
    await back()
    await settle()
    expect(depth()).toBe(1)
    expect(url()).toBe('/?d=a&tab=x')
  })
})

describe('E. 頁面自己移除 param（非 POP）：經守門，且不回到帶 param 的紀錄', () => {
  async function openTwo() {
    setup(['/'])
    fireEvent.click(screen.getByText('open-a')); await screen.findByText('layer-1')
    fireEvent.click(topW().getByText('open-next')); await screen.findByText('layer-2')
  }
  it('守門通過：全關、網址維持無 param、不閃爍重開', async () => {
    const asked = vi.fn()
    await openTwo()
    guard = () => { asked(); return true }
    fireEvent.click(screen.getByText('page-remove-param'))
    await waitFor(() => expect(depth()).toBe(0))
    await settle()
    expect(asked).toHaveBeenCalled()
    expect(depth()).toBe(0)
    expect(url()).toBe('/')
  })
  it('守門拒絕：兩層都留著、param 補回', async () => {
    const asked = vi.fn()
    await openTwo()
    guard = () => { asked(); return false }
    fireEvent.click(screen.getByText('page-remove-param'))
    await waitFor(() => expect(asked).toHaveBeenCalled())
    await settle()
    expect(depth()).toBe(2)
    expect(url()).toBe('/?d=a')
  })
})

// F.（PanelSlot 變空只關自己那層）是 inknock 業務層 page-panel-slot 的測試，不屬面板殼，未搬。

describe('G. 快照還原不還原帶回呼的 seed（回呼綁在已卸載的頁面實例）', () => {
  function G() {
    const { openPanel } = usePanel()
    const nav = useNavigate()
    const depth = usePanelStack().stack.length
    return (<div><i data-testid="depth">{depth}</i>
      <button onClick={() => openPanel('c', { n: 1 })}>open-pure</button>
      <button onClick={() => openPanel('c', { n: 1, onSaved: () => {} })}>open-cb</button>
      <button onClick={() => nav('/other')}>go-other</button></div>)
  }
  async function run(btn) {
    installMatchMedia(false)
    router = createMemoryRouter([{ path: '*', element: <PanelStackProvider router={routerAdapter}><G /><PanelHost registry={registry} /></PanelStackProvider> }], { initialEntries: ['/'] })
    render(<RouterProvider router={router} />)
    fireEvent.click(screen.getByText(btn)); await screen.findByText('layer-1')
    fireEvent.click(screen.getByText('go-other')); await waitFor(() => expect(depth()).toBe(0))
    await back(); await settle()
  }
  it('純身分 seed：照舊還原', async () => { await run('open-pure'); expect(depth()).toBe(1) })
  it('含回呼的 seed：不還原', async () => { await run('open-cb'); expect(depth()).toBe(0) })
})

describe('H. 「‹ 來源名」', () => {
  function Ti({ seed, openPanel }) {
    const [t, setT] = React.useState(seed.t)
    usePanelHeader({ title: t })
    return (<div><span>ti-{seed.n}</span>
      <button onClick={() => setT('NEW')}>retitle</button>
      <button onClick={() => openPanel('ti', { n: seed.n + 1, t: 'second' })}>go-next</button></div>)
  }
  const reg2 = { ti: { component: Ti } }
  function HP() { const { openPanel } = usePanel(); return <div><button onClick={() => openPanel('ti', { n: 1, t: window.__t })}>open</button></div> }
  async function start(t) {
    installMatchMedia(false);
    window.__t = t
    router = createMemoryRouter([{ path: '*', element: <PanelStackProvider router={routerAdapter}><HP /><PanelHost registry={reg2} /></PanelStackProvider> }], { initialEntries: ['/'] })
    render(<RouterProvider router={router} />)
    fireEvent.click(screen.getByText('open')); await screen.findByText('ti-1')
  }
  it('下層標題為空：退回「返回」，不顯示空的「‹ 」', async () => {
    await start('')
    fireEvent.click(topW().getByText('go-next')); await screen.findByText('ti-2')
    expect(topW().getByRole('button', { name: /^返回/ }).textContent).toBe('‹ 返回')
  })
  it('下層標題改變時，上層「‹ 來源名」跟著更新', async () => {
    await start('first')
    fireEvent.click(topW().getByText('go-next')); await screen.findByText('ti-2')
    expect(topW().getByRole('button', { name: /^返回/ }).textContent).toBe('‹ first')
    const lower = screen.getAllByText('retitle')[0]
    fireEvent.click(lower)
    await waitFor(() => expect(topW().getByRole('button', { name: /^返回/ }).textContent).toBe('‹ NEW'))
  })
})
