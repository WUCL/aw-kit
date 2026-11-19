import { describe, it, expect } from 'vitest'
import { isRowActivateKey } from '../../src/ui/submit-enter'

// 可點列的鍵盤啟動（2026-10-08 review：服務目錄手機列原本只認 Enter，與 DataTable 不一致）
describe('isRowActivateKey', () => {
  const row = {}
  const k = (key: string, extra: object = {}) => ({ key, target: row, currentTarget: row, ...extra })
  it('焦點在列本身：Enter、空白鍵都啟動', () => {
    expect(isRowActivateKey(k('Enter'))).toBe(true)
    expect(isRowActivateKey(k(' '))).toBe(true)
    expect(isRowActivateKey(k('a'))).toBe(false)
  })
  it('組字中不啟動（含 Safari 的 keyCode 229）', () => {
    expect(isRowActivateKey(k('Enter', { nativeEvent: { isComposing: true } }))).toBe(false)
    expect(isRowActivateKey(k(' ', { keyCode: 229 }))).toBe(false)
  })
  it('列內子元素冒泡上來的不啟動', () => {
    expect(isRowActivateKey({ key: 'Enter', target: {}, currentTarget: row })).toBe(false)
  })
})
