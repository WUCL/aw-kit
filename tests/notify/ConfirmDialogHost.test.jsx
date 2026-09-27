// tests/ConfirmDialogHost.test.jsx
import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, cleanup, fireEvent, waitFor } from '@testing-library/react'
import { useState } from 'react'
import ConfirmDialogHost from '../../src/notify/ConfirmDialogHost.jsx'
import { confirm } from '../../src/notify/confirmDialog.js'

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

describe('ConfirmDialogHost', () => {
  it('two-button confirm resolves true when confirm button is clicked', async () => {
    render(<ConfirmDialogHost />)
    const promise = confirm({ title: '確定要刪除？', confirmLabel: '刪除' })
    const btn = await screen.findByText('刪除')
    fireEvent.click(btn)
    await expect(promise).resolves.toBe(true)
  })

  it('two-button confirm resolves false when cancel button is clicked', async () => {
    render(<ConfirmDialogHost />)
    const promise = confirm({ title: '確定？' })
    const btn = await screen.findByText('取消')
    fireEvent.click(btn)
    await expect(promise).resolves.toBe(false)
  })

  it('multi-action confirm resolves with the chosen action key', async () => {
    render(<ConfirmDialogHost />)
    const promise = confirm({
      title: '套用範圍',
      actions: [{ key: 'series', label: '整系列' }, { key: 'single', label: '單筆' }],
    })
    const btn = await screen.findByText('整系列')
    fireEvent.click(btn)
    await expect(promise).resolves.toBe('series')
  })

  it('does not call .focus() on a trigger element that was unmounted while the dialog was open', async () => {
    // Mirrors the real-world case the guard is for (per its comment): the trigger lived
    // inside something like a menu that closes *after* the dialog has already opened and
    // captured document.activeElement — not simultaneously with the click that opened it.
    let triggerFocusSpy
    function Harness() {
      const [showTrigger, setShowTrigger] = useState(true)
      return (
        <>
          <ConfirmDialogHost />
          {showTrigger && (
            <button
              ref={(el) => { if (el) triggerFocusSpy = vi.spyOn(el, 'focus') }}
              onClick={() => confirm({ title: '確定？' })}
            >
              觸發
            </button>
          )}
          <button onClick={() => setShowTrigger(false)}>移除</button>
        </>
      )
    }
    render(<Harness />)
    const triggerBtn = screen.getByText('觸發')
    triggerBtn.focus() // fireEvent.click does not itself move document.activeElement in jsdom
    triggerFocusSpy.mockClear() // discard the setup .focus() call above; we only care about calls during dialog cleanup
    fireEvent.click(triggerBtn) // dialog opens; restoreFocusRef captures the still-mounted trigger
    await screen.findByText('取消')
    fireEvent.click(screen.getByText('移除')) // trigger unmounts while the dialog is still open
    const cancelBtn = screen.getByText('取消')
    expect(() => fireEvent.click(cancelBtn)).not.toThrow()
    // settle() delays setDialog(null) by 150ms (for the closing transition), and the
    // focus-restore cleanup only runs once `dialog` actually becomes null — wait for that.
    await waitFor(() => expect(screen.queryByText('取消')).toBeNull())
    expect(triggerFocusSpy).not.toHaveBeenCalled()
  })

  it('warns via console.warn when a second host mounts concurrently', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const { unmount } = render(<ConfirmDialogHost />)
    render(<ConfirmDialogHost />)
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('已掛載超過一次'))
    unmount()
  })

  it('out-of-order unmount: if the first host unmounts while a second (warned) host is still mounted, a third host still warns', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const { unmount: unmountA } = render(<ConfirmDialogHost />)
    render(<ConfirmDialogHost />)
    unmountA()
    warnSpy.mockClear()
    render(<ConfirmDialogHost />)
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('已掛載超過一次'))
  })

  // inknock 2026-09-27「刪除供應商」兩段確認：第一個按下後立刻開第二個，
  // 第一個的 150ms 收尾把第二個也清掉——畫面一閃而過，第二個 Promise 永遠不 resolve。
  it('a confirm opened right after the previous one settles survives the close animation', async () => {
    render(<ConfirmDialogHost />)
    const first = confirm({ title: '第一次', confirmLabel: '刪除' })
    fireEvent.click(await screen.findByText('刪除'))
    await expect(first).resolves.toBe(true)
    const second = confirm({ title: '第二次', confirmLabel: '確定永久刪除' })
    await screen.findByText('確定永久刪除')
    await new Promise(r => setTimeout(r, 250))  // 越過上一個的 150ms 收尾
    const btn = screen.queryByText('確定永久刪除')
    expect(btn).not.toBeNull()
    fireEvent.click(btn)
    await expect(second).resolves.toBe(true)
  })
})
