// tests/confirmDialog.test.js
import { describe, it, expect } from 'vitest'
import { confirm, registerConfirmHost } from '../../src/notify/confirmDialog.js'

describe('confirmDialog', () => {
  it('resolves false when host is not mounted (two-button safe default)', async () => {
    const result = await confirm({ title: 'x', body: 'y' })
    expect(result).toBe(false)
  })

  it('resolves null when host is not mounted (multi-action safe default)', async () => {
    const result = await confirm({ title: 'x', actions: [{ key: 'ok', label: 'OK' }] })
    expect(result).toBeNull()
  })

  it('registerConfirmHost wires the handler and resolves via it', async () => {
    const unregister = registerConfirmHost((opts, resolve) => resolve(true))
    const result = await confirm({ title: 'confirm?' })
    expect(result).toBe(true)
    unregister()
  })

  it('unregister restores the safe default', async () => {
    const unregister = registerConfirmHost((opts, resolve) => resolve(true))
    unregister()
    const result = await confirm({ title: 'x' })
    expect(result).toBe(false)
  })

  it('a second registerConfirmHost call replaces the handler; the old unregister is a no-op', async () => {
    const unregisterA = registerConfirmHost((opts, resolve) => resolve('A'))
    registerConfirmHost((opts, resolve) => resolve('B'))
    unregisterA() // should NOT clear the current (B) handler
    const result = await confirm({ title: 'x' })
    expect(result).toBe('B')
  })
})
