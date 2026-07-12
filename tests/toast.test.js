// tests/toast.test.js
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { toast } from '../src/toast.js'

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
