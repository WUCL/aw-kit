// 2026-11-19 自 inknock tests/tooltip-touch.test.tsx 搬入（inknock ADR 0002 D3 批）；主題改用測試夾具 helpers/test-theme。
// @vitest-environment jsdom
// Tooltip 觸控（2026-11-15，使用者看原型選 C）：點一下切換說明；在可點的東西裡（列、按鈕、連結）不出說明。
// 永遠不攔點擊（補審：沒有語意的可點 div 從 DOM 認不出來，攔了會吃掉列的點擊）。
import type { ReactElement } from 'react'
import { renderWithTheme } from './helpers/test-theme'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, fireEvent, screen } from '@testing-library/react'
import { Tooltip } from '../../src/ui/tooltip'

afterEach(() => { vi.useRealTimers() })
const tip = () => screen.queryByRole('tooltip')
// 真實觸控的順序：pointerdown → pointerup → click（detail 1）
function touchTap(el: Element) {
  fireEvent.pointerDown(el, { pointerType: 'touch' })
  fireEvent.pointerUp(el, { pointerType: 'touch' })
  fireEvent.click(el, { detail: 1 })
}

describe('Tooltip 觸控', () => {
  it('滑鼠：移入出現、移出消失', () => {
    renderWithTheme(<Tooltip text="說明"><span>觸發</span></Tooltip>)
    fireEvent.pointerEnter(screen.getByText('觸發').parentElement!, { pointerType: 'mouse' })
    expect(tip()?.textContent).toBe('說明')
    fireEvent.pointerLeave(screen.getByText('觸發').parentElement!, { pointerType: 'mouse' })
    expect(tip()).toBeNull()
  })

  it('觸控的 pointerenter 不開（iOS 點擊補發的模擬 hover 不可黏住）', () => {
    renderWithTheme(<Tooltip text="說明"><span>觸發</span></Tooltip>)
    fireEvent.pointerEnter(screen.getByText('觸發').parentElement!, { pointerType: 'touch' })
    expect(tip()).toBeNull()
  })

  it('列外：點一下出現、再點收起、點別處收起', () => {
    renderWithTheme(<div><Tooltip text="說明"><span>觸發</span></Tooltip><p>別處</p></div>)
    touchTap(screen.getByText('觸發'))
    expect(tip()?.textContent).toBe('說明')
    touchTap(screen.getByText('觸發'))
    expect(tip()).toBeNull()
    touchTap(screen.getByText('觸發'))
    fireEvent.pointerDown(screen.getByText('別處'), { pointerType: 'touch' })
    expect(tip()).toBeNull()
  })

  it.each([
    ['role=button 的列', (onClick: () => void, child: ReactElement) => <div role="button" tabIndex={0} onClick={onClick}>{child}</div>],
    ['可聚焦的表格列', (onClick: () => void, child: ReactElement) => <table><tbody><tr tabIndex={0} onClick={onClick}><td>{child}</td></tr></tbody></table>],
  ])('在%s裡：點擊照常交給列、不出說明', (_, wrap) => {
    let n = 0
    renderWithTheme(wrap(() => { n++ }, <Tooltip text="說明"><span>標籤</span></Tooltip>))
    touchTap(screen.getByText('標籤'))
    expect(n).toBe(1)
    expect(tip()).toBeNull()
  })

  it('觸發點包著按鈕：按鈕照常可按、不出說明', () => {
    let n = 0
    renderWithTheme(<Tooltip text="說明"><button onClick={() => { n++ }}>按鈕</button></Tooltip>)
    touchTap(screen.getByText('按鈕'))
    expect(n).toBe(1)
    expect(tip()).toBeNull()
  })

  it('鍵盤觸發的 click（detail 0）不切換', () => {
    renderWithTheme(<Tooltip text="說明"><span>觸發</span></Tooltip>)
    fireEvent.pointerDown(screen.getByText('觸發'), { pointerType: 'touch' })
    fireEvent.click(screen.getByText('觸發'), { detail: 0 })
    expect(tip()).toBeNull()
  })

  it('沒有語意的可點 div（佣金報表設計師列）：點擊照常交給列（說明可能也出現，但列一定要開）', () => {
    let n = 0
    renderWithTheme(<div onClick={() => { n++ }}><Tooltip text="說明"><span>✦</span></Tooltip></div>)
    touchTap(screen.getByText('✦'))
    expect(n).toBe(1)
  })

  it('觸控點擊不 preventDefault、照常往上傳（列外的觸發點也一樣）', () => {
    let bubbled = 0
    renderWithTheme(<div onClick={() => { bubbled++ }}><Tooltip text="說明"><span>觸發</span></Tooltip></div>)
    fireEvent.pointerDown(screen.getByText('觸發'), { pointerType: 'touch' })
    const notPrevented = fireEvent.click(screen.getByText('觸發'), { detail: 1 })
    expect(notPrevented).toBe(true)
    expect(bubbled).toBe(1)
    expect(tip()).not.toBeNull()
  })

  it('觸控開著時點觸發點內的按鈕：按鈕照常、說明收起', () => {
    let n = 0
    renderWithTheme(<Tooltip text="說明"><span>文字<button onClick={() => { n++ }}>鈕</button></span></Tooltip>)
    touchTap(screen.getByText('文字'))
    expect(tip()).not.toBeNull()
    touchTap(screen.getByText('鈕'))
    expect(n).toBe(1)
    expect(tip()).toBeNull()
  })

  it('滑鼠開著時用手指點一下：收起', () => {
    renderWithTheme(<Tooltip text="說明"><span>觸發</span></Tooltip>)
    fireEvent.pointerEnter(screen.getByText('觸發').parentElement!, { pointerType: 'mouse' })
    expect(tip()).not.toBeNull()
    touchTap(screen.getByText('觸發'))
    expect(tip()).toBeNull()
  })

  it('可聚焦的捲動容器（tabIndex=0 的 div）不算可點：裡面的提示照樣點得開', () => {
    renderWithTheme(<div tabIndex={0}><Tooltip text="說明"><span>觸發</span></Tooltip></div>)
    touchTap(screen.getByText('觸發'))
    expect(tip()).not.toBeNull()
  })

  it('觸控開啟 4 秒後自動收起', () => {
    vi.useFakeTimers()
    renderWithTheme(<Tooltip text="說明"><span>觸發</span></Tooltip>)
    touchTap(screen.getByText('觸發'))
    expect(tip()).not.toBeNull()
    act(() => { vi.advanceTimersByTime(4100) })
    expect(tip()).toBeNull()
  })

  it('觸控開啟後滑鼠移入（iPad 接觸控板）：改由滑鼠接手，4 秒計時取消', () => {
    vi.useFakeTimers()
    renderWithTheme(<Tooltip text="說明"><span>觸發</span></Tooltip>)
    touchTap(screen.getByText('觸發'))
    fireEvent.pointerEnter(screen.getByText('觸發').parentElement!, { pointerType: 'mouse' })
    act(() => { vi.advanceTimersByTime(5000) })
    expect(tip()).not.toBeNull()
  })

  it('受控模式（InfoTip）不受觸控切換影響', () => {
    renderWithTheme(<Tooltip text="說明" open={false}><span>觸發</span></Tooltip>)
    touchTap(screen.getByText('觸發'))
    expect(tip()).toBeNull()
  })
})
