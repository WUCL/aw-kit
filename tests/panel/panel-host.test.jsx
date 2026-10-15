// PanelHost／SlideOver：Esc 只關當層、IME Esc 不關、上方對話框時讓出、守門 mutex、守門拒絕不關。
import React from 'react'
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest'
import { render, fireEvent, cleanup, screen, waitFor, act, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { installMatchMedia, routerAdapter } from './helpers.jsx'
import { PanelStackProvider, PanelHost, usePanel, usePanelStack, usePanelCloseGuard } from '../../src/panel/index.js'

let guard = null

function Content({ seed, openPanel, back, closeAll }) {
  usePanelCloseGuard(guard ? () => guard() : null)
  return (
    <div>
      <span>layer-{seed.n}</span>
      <button onClick={() => openPanel('c', { n: seed.n + 1 })}>open-next</button>
      <button onClick={back}>do-back</button>
      <button onClick={closeAll}>do-closeAll</button>
    </div>
  )
}
const registry = { c: { component: Content, ariaLabel: '測試面板' } }

function Depth() { return <i data-testid="depth">{usePanelStack().stack.length}</i> }
function Opener() { const { openPanel } = usePanel(); return <button onClick={() => openPanel('c', { n: 1 })}>open-first</button> }

function setup() {
  installMatchMedia(false)
  render(
    <MemoryRouter><PanelStackProvider router={routerAdapter}>
      <Opener /><Depth /><PanelHost registry={registry} />
    </PanelStackProvider></MemoryRouter>,
  )
}
const topW = () => within(screen.getByRole('dialog'))
const depth = () => Number(screen.getByTestId('depth').textContent)
const esc = (init = {}) => fireEvent.keyDown(document, { key: 'Escape', code: 'Escape', keyCode: 27, ...init })
async function openTwo() {
  fireEvent.click(screen.getByText('open-first'))
  await screen.findByText('layer-1')
  fireEvent.click(topW().getByText('open-next'))
  await screen.findByText('layer-2')
}

beforeEach(() => { guard = null })
afterEach(() => { cleanup(); document.body.innerHTML = '' })

describe('PanelHost Esc', () => {
  it('depth 2：Esc 只關當層，留下第一層', async () => {
    setup(); await openTwo()
    esc()
    await waitFor(() => expect(depth()).toBe(1))
    expect(screen.getByText('layer-1')).toBeTruthy()
  })
  it('depth 1：Esc 關閉整個殼', async () => {
    setup(); fireEvent.click(screen.getByText('open-first')); await screen.findByText('layer-1')
    esc()
    await waitFor(() => expect(depth()).toBe(0), { timeout: 1500 })
  })
  it('IME 組字中的 Esc（keyCode 229）不關', async () => {
    setup(); await openTwo()
    esc({ keyCode: 229 })
    esc({ isComposing: true })
    await new Promise(r => setTimeout(r, 50))
    expect(depth()).toBe(2)
  })
  it('上方有 aria-modal 對話框時 Esc 不回應', async () => {
    setup(); await openTwo()
    const dlg = document.createElement('div')
    dlg.setAttribute('aria-modal', 'true'); dlg.style.zIndex = String(Z_CONFIRM)
    document.body.appendChild(dlg)
    esc()
    await new Promise(r => setTimeout(r, 50))
    expect(depth()).toBe(2)
  })
})
const Z_CONFIRM = 9500

describe('PanelHost 守門', () => {
  it('守門回 false：Esc 不關', async () => {
    let armed = false
    guard = () => !armed
    setup(); await openTwo(); armed = true
    esc()
    await new Promise(r => setTimeout(r, 50))
    expect(depth()).toBe(2)
  })
  it('mutex：back 與 closeAll 同時觸發，守門只被問一次、只過一條（只退一層）', async () => {
    let resolve
    const fn = vi.fn(() => new Promise(r => { resolve = r }))
    let armed = false
    guard = () => armed ? fn() : true
    setup(); await openTwo(); armed = true
    fireEvent.click(topW().getByText('do-back'))
    fireEvent.click(topW().getByText('do-closeAll'))
    await act(async () => { resolve(true) })
    await waitFor(() => expect(depth()).toBe(1))
    await new Promise(r => setTimeout(r, 400))   // 若 closeAll 也放行，會變 0
    expect(fn).toHaveBeenCalledTimes(1)
    expect(depth()).toBe(1)
  })
})
