// tests/ToastHost.test.jsx
import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import ToastHost from '../../src/notify/ToastHost.jsx'
import { toast } from '../../src/notify/toast.js'

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

describe('ToastHost', () => {
  it('renders a success toast message', async () => {
    render(<ToastHost />)
    toast.success(`msg-${Date.now()}`)
    const messages = await screen.findAllByText(/^msg-/)
    expect(messages.length).toBeGreaterThan(0)
  })

  it('warns via console.warn when a second host mounts concurrently', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const { unmount: unmountA } = render(<ToastHost />)
    render(<ToastHost />)
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('已掛載超過一次'))
    unmountA()
  })

  it('unmounting resets the mounted flag so a later single host does not warn', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const { unmount } = render(<ToastHost />)
    unmount()
    render(<ToastHost />)
    expect(warnSpy).not.toHaveBeenCalled()
  })

  it('out-of-order unmount: if the first host unmounts while a second (warned) host is still mounted, a third host still warns', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const { unmount: unmountA } = render(<ToastHost />)       // A claims the flag
    render(<ToastHost />)                                      // B mounts concurrently, warns, does not claim
    unmountA()                                                 // A unmounts; flag must stay true (B still live)
    warnSpy.mockClear()
    render(<ToastHost />)                                      // C mounts while B is still live -> must warn
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('已掛載超過一次'))
  })
})
