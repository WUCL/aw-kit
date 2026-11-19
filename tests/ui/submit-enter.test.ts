import { describe, it, expect } from 'vitest'
import { isSubmitEnter } from '../../src/ui/submit-enter'

describe('isSubmitEnter：輸入法選字的 Enter 不算送出', () => {
  it('一般 Enter → 送出', () => {
    expect(isSubmitEnter({ key: 'Enter', keyCode: 13, nativeEvent: { isComposing: false } })).toBe(true)
  })
  it('組字中的 Enter（Chrome／Firefox：isComposing）→ 不送出', () => {
    expect(isSubmitEnter({ key: 'Enter', keyCode: 13, nativeEvent: { isComposing: true } })).toBe(false)
  })
  it('Safari 組字結束後補發的 keydown（keyCode 229）→ 不送出', () => {
    expect(isSubmitEnter({ key: 'Enter', keyCode: 229, nativeEvent: { isComposing: false } })).toBe(false)
  })
  it('其他按鍵 → 不送出', () => {
    expect(isSubmitEnter({ key: 'a', keyCode: 65, nativeEvent: { isComposing: false } })).toBe(false)
  })
})

import { isCancelEscape } from '../../src/ui/submit-enter'
describe('isCancelEscape：輸入法取消選字的 Esc 不算關閉', () => {
  it('一般 Esc（原生事件）→ 關閉', () => {
    expect(isCancelEscape({ key: 'Escape', keyCode: 27, isComposing: false })).toBe(true)
  })
  it('組字中的 Esc（原生事件 isComposing）→ 不關閉', () => {
    expect(isCancelEscape({ key: 'Escape', keyCode: 27, isComposing: true })).toBe(false)
  })
  it('組字中的 Esc（React 事件 nativeEvent.isComposing）→ 不關閉', () => {
    expect(isCancelEscape({ key: 'Escape', keyCode: 27, nativeEvent: { isComposing: true } })).toBe(false)
  })
  it('Safari keyCode 229 → 不關閉', () => {
    expect(isCancelEscape({ key: 'Escape', keyCode: 229 })).toBe(false)
  })
})
