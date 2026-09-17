// tests/injectStyles.test.js
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { injectStyles } from '../../src/notify/injectStyles.js'

describe('injectStyles', () => {
  beforeEach(() => {
    document.getElementById('fbk-styles')?.remove()
  })

  it('injects a <style id="fbk-styles"> tag into <head>', () => {
    injectStyles()
    const el = document.getElementById('fbk-styles')
    expect(el).not.toBeNull()
    expect(el.tagName).toBe('STYLE')
  })

  it('is idempotent — calling twice does not create a second tag', () => {
    injectStyles()
    injectStyles()
    const all = document.querySelectorAll('#fbk-styles')
    expect(all).toHaveLength(1)
  })

  it('is a no-op when document is undefined (SSR)', () => {
    const originalDocument = globalThis.document
    // @ts-ignore
    delete globalThis.document
    expect(() => injectStyles()).not.toThrow()
    globalThis.document = originalDocument
  })
})
