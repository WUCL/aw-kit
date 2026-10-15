// 同一層多支關閉守門：互不覆蓋、卸載其中一支只移除自己、同次關閉遇拒絕即停。
import React, { useState } from 'react'
import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, fireEvent, cleanup, screen, act } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { installMatchMedia, routerAdapter } from './helpers.jsx'
import { PanelStackProvider, PanelHost, usePanel, usePanelCloseGuard } from '../../src/panel/index.js'

const calls = []
const answers = { a: true, b: true }
function GuardB() { usePanelCloseGuard(() => { calls.push('b'); return answers.b }); return <i>child-b</i> }
function Content({ closeAll }) {
  const [showB, setShowB] = useState(true)
  usePanelCloseGuard(() => { calls.push('a'); return answers.a })
  return (<div>{showB && <GuardB />}<button onClick={() => setShowB(false)}>unmount-b</button><button onClick={closeAll}>do-close</button></div>)
}
const registry = { c: { component: Content, ariaLabel: '測試面板' } }
function Opener() { const { openPanel } = usePanel(); return <button onClick={() => openPanel('c', {})}>open</button> }
function setup() {
  installMatchMedia(false)
  const router = createMemoryRouter([{ path: '*', element: <PanelStackProvider router={routerAdapter}><Opener /><PanelHost registry={registry} /></PanelStackProvider> }])
  render(<RouterProvider router={router} />)
}
const reset = (a, b) => { calls.length = 0; answers.a = a; answers.b = b }
const close = async () => { await act(async () => { fireEvent.click(screen.getByText('do-close')) }); await act(async () => { await new Promise(r => setTimeout(r, 400)) }) }
afterEach(() => { cleanup(); document.body.innerHTML = ''; vi.restoreAllMocks() })

describe('多支守門', () => {
  it('兩支都登記：先登記者（子層，effect 先跑）拒絕時後者不被問；放行才問下一支；任一拒絕即不關', async () => {
    reset(true, false); setup()
    fireEvent.click(screen.getByText('open')); await screen.findByText('child-b')
    await close()
    expect(calls).toEqual(['b'])
    expect(screen.queryByText('child-b')).not.toBeNull()
    reset(false, true); await close()
    expect(calls).toEqual(['b', 'a'])
    expect(screen.queryByText('child-b')).not.toBeNull()
  })
  it('卸載其中一支後，另一支仍有效（舊單格登記會被清成 null）', async () => {
    reset(false, true); setup()
    fireEvent.click(screen.getByText('open')); await screen.findByText('child-b')
    fireEvent.click(screen.getByText('unmount-b'))
    expect(screen.queryByText('child-b')).toBeNull()
    await close()
    expect(calls).toEqual(['a'])
    expect(screen.queryByText('do-close')).not.toBeNull()
  })
})
