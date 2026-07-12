// tests/ConfirmDialogHost.test.jsx
import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, cleanup, fireEvent } from '@testing-library/react'
import { useState } from 'react'
import ConfirmDialogHost from '../src/ConfirmDialogHost.jsx'
import { confirm } from '../src/confirmDialog.js'

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

  it('does not throw when restoring focus to an element that was unmounted while the dialog was open', async () => {
    function Harness() {
      const [showTrigger, setShowTrigger] = useState(true)
      return (
        <>
          <ConfirmDialogHost />
          {showTrigger && (
            <button
              onClick={() => {
                confirm({ title: '確定？' })
                setShowTrigger(false) // trigger button unmounts while dialog is open
              }}
            >
              觸發
            </button>
          )}
        </>
      )
    }
    render(<Harness />)
    fireEvent.click(screen.getByText('觸發'))
    const cancelBtn = await screen.findByText('取消')
    expect(() => fireEvent.click(cancelBtn)).not.toThrow()
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
})
