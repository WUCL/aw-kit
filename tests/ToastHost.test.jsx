// tests/ToastHost.test.jsx
import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import ToastHost from '../src/ToastHost.jsx'
import { toast } from '../src/toast.js'

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
})
