import { describe, it, expect, vi } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useIsMobile } from '../../src/panel/panel-config.js'

// A3：同一個 query 共用一個 MediaQueryList；window.matchMedia 被換掉時快取要失效。
function stub(matches) {
  const fn = vi.fn((query) => ({ matches, media: query, addEventListener: () => {}, removeEventListener: () => {} }))
  window.matchMedia = fn
  return fn
}

describe('useMediaQuery cache', () => {
  it('re-renders reuse one MediaQueryList per query (no new matchMedia per render)', () => {
    const mm = stub(true)
    const { result, rerender } = renderHook(() => useIsMobile())
    rerender(); rerender(); rerender()
    expect(result.current).toBe(true)
    expect(mm).toHaveBeenCalledTimes(1)
  })
  it('replacing window.matchMedia invalidates the cache', () => {
    stub(true)
    const a = renderHook(() => useIsMobile()); expect(a.result.current).toBe(true); a.unmount()
    const mm2 = stub(false)
    const b = renderHook(() => useIsMobile()); expect(b.result.current).toBe(false)
    expect(mm2).toHaveBeenCalled()
  })
})
