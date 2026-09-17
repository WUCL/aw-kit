// tests/toast.test.js
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { toast } from '../../src/notify/toast.js'

describe('toast', () => {
  it('success emits an item with default duration 3500 and type success', () => {
    const received = []
    const unsub = toast.subscribe(item => received.push(item))
    toast.success('已儲存')
    expect(received).toHaveLength(1)
    expect(received[0]).toMatchObject({ type: 'success', message: '已儲存', duration: 3500 })
    unsub()
  })

  it('error defaults to duration:null (persistent)', () => {
    const received = []
    const unsub = toast.subscribe(item => received.push(item))
    toast.error('失敗了')
    expect(received[0]).toMatchObject({ type: 'error', duration: null })
    unsub()
  })

  it('warn auto-dismisses after 4000ms (it is a prompt, not a failure)', () => {
    const received = []
    const unsub = toast.subscribe(item => received.push(item))
    toast.warn('請選擇設計師')
    expect(received[0]).toMatchObject({ type: 'warn', message: '請選擇設計師', duration: 4000 })
    unsub()
  })

  it('warn and error are separate types, so a prompt never renders as a failure', () => {
    const received = []
    const unsub = toast.subscribe(item => received.push(item))
    toast.warn('同一句話')
    toast.error('同一句話')
    // dedupe is keyed on the message, so the second call must survive on its own type
    expect(received.map(r => r.type)).toEqual(['warn', 'error'])
    unsub()
  })

  it('an explicit duration still overrides the per-level default', () => {
    const received = []
    const unsub = toast.subscribe(item => received.push(item))
    toast.warn('特例', { duration: null })
    expect(received[0]).toMatchObject({ type: 'warn', duration: null })
    unsub()
  })

  it('dedupes same key within 300ms unless action is present', () => {
    vi.useFakeTimers()
    const received = []
    const unsub = toast.subscribe(item => received.push(item))
    toast.success('重複訊息')
    toast.success('重複訊息')
    expect(received).toHaveLength(1)
    vi.advanceTimersByTime(301)
    toast.success('重複訊息')
    expect(received).toHaveLength(2)
    unsub()
    vi.useRealTimers()
  })

  it('toasts with action bypass dedupe', () => {
    const received = []
    const unsub = toast.subscribe(item => received.push(item))
    const action = { label: '復原', onClick: () => {} }
    toast.success('已刪除', { action, key: 'row-1' })
    toast.success('已刪除', { action, key: 'row-2' })
    expect(received).toHaveLength(2)
    unsub()
  })

  it('subscribe returns an unsubscribe function', () => {
    const received = []
    const unsub = toast.subscribe(item => received.push(item))
    unsub()
    toast.success('不該收到')
    expect(received).toHaveLength(0)
  })
})
