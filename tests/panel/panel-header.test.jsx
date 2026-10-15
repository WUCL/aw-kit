// PanelHeader／usePanelHeader：depth1 無「‹」、depth2 顯示前一層標題、✕ 只退一層。
import React from 'react'
import { describe, it, expect, afterEach } from 'vitest'
import { render, fireEvent, cleanup, screen, waitFor, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { installMatchMedia, routerAdapter } from './helpers.jsx'
import { PanelStackProvider, PanelHost, usePanel, usePanelStack, usePanelHeader } from '../../src/panel/index.js'

function Content({ seed, openPanel }) {
  usePanelHeader({ title: `標題${seed.n}`, meta: seed.n === 2 ? 'NO-2' : undefined })
  return <button onClick={() => openPanel('c', { n: seed.n + 1 })}>open-next</button>
}
const registry = { c: { component: Content } }
function Depth() { return <i data-testid="depth">{usePanelStack().stack.length}</i> }
function Opener() { const { openPanel } = usePanel(); return <button onClick={() => openPanel('c', { n: 1 })}>open-first</button> }
function setup(reduced = false) {
  installMatchMedia(false, reduced)
  render(<MemoryRouter><PanelStackProvider router={routerAdapter}><Opener /><Depth /><PanelHost registry={registry} /></PanelStackProvider></MemoryRouter>)
}
const depth = () => Number(screen.getByTestId('depth').textContent)
afterEach(() => { cleanup(); document.body.innerHTML = '' })

describe('PanelHeader', () => {
  it('depth 1：無「‹」、標題為登記值', async () => {
    setup(true); fireEvent.click(screen.getByText('open-first'))
    await screen.findByRole('heading', { name: '標題1' })
    expect(screen.queryByText(/‹/)).toBeNull()
  })
  it('depth 2：有「‹ 標題1」、meta 顯示；✕ 只退一層', async () => {
    setup(true); fireEvent.click(screen.getByText('open-first'))
    await screen.findByRole('heading', { name: '標題1' })
    fireEvent.click(within(screen.getByRole('dialog')).getByText('open-next'))
    await screen.findByText('NO-2')
    expect(screen.getByText(/‹ 標題1/)).toBeTruthy()
    fireEvent.click(within(screen.getByRole('dialog')).getByLabelText('關閉'))
    await waitFor(() => expect(depth()).toBe(1))
    await waitFor(() => expect(screen.queryByText(/‹/)).toBeNull())   // 滑出中的第二層移除後
  })
})
