import { describe, it, expect, afterEach } from 'vitest'
import { getPanelExitMs } from '../../src/panel/SlideOver.jsx'

// A1：--aw-panel-motion 可寫 ms 或 s；parseFloat('.22s') = 0.22 會讓 ghost 層幾乎立刻被卸載。
const set = (v) => document.documentElement.style.setProperty('--aw-panel-motion', v)
afterEach(() => document.documentElement.style.removeProperty('--aw-panel-motion'))

describe('getPanelExitMs', () => {
  it.each([
    ['220ms', 220], ['.22s', 220], ['0.2s', 200], ['300ms', 300], ['1s', 1000], ['0ms', 0],
  ])('%s -> %i', (raw, ms) => {
    set(raw)
    expect(getPanelExitMs()).toBeCloseTo(ms, 5)
  })
  it.each([[''], ['garbage'], ['12px'], ['-5ms'], ['ms']])('unparsable %j falls back to 220', (raw) => {
    set(raw)
    expect(getPanelExitMs()).toBe(220)
  })
})
