import { describe, expect, it } from 'vitest'
import { sanitizeNumber } from '../../src/ui/sanitize-number'

describe('sanitizeNumber：數字欄清洗（2026-09-29）', () => {
  it('英文、中文、符號一律濾掉', () => {
    expect(sanitizeNumber('12abc')).toBe('12')
    expect(sanitizeNumber('三百')).toBe('')
    expect(sanitizeNumber('1e5')).toBe('15')
    expect(sanitizeNumber('+300')).toBe('300')
  })

  it('全形數字轉半形，不是刪掉（中文輸入法）', () => {
    expect(sanitizeNumber('１２')).toBe('12')
    expect(sanitizeNumber('１２．５')).toBe('12.5')
    expect(sanitizeNumber('３。５')).toBe('3.5')
  })

  it('千分位逗號拿掉（半形、全形）', () => {
    expect(sanitizeNumber('1,200')).toBe('1200')
    expect(sanitizeNumber('1，200')).toBe('1200')
  })

  it('貼上帶貨幣符號的金額', () => {
    expect(sanitizeNumber('NT$1,200')).toBe('1200')
    expect(sanitizeNumber('$ 99.50 元')).toBe('99.50')
  })

  it('decimal 只留第一個小數點', () => {
    expect(sanitizeNumber('1.2.3')).toBe('1.23')
    expect(sanitizeNumber('.5')).toBe('.5')
  })

  it('integer 保留第一個小數點、丟掉點之後的數字；digits 整段截掉（不保留點）', () => {
    expect(sanitizeNumber('3.5', 'integer')).toBe('3.')
    expect(sanitizeNumber('1200.50', 'integer')).toBe('1200.')
    expect(sanitizeNumber('1,200.00', 'integer')).toBe('1200.')
    expect(sanitizeNumber('1,200.50', 'integer')).toBe('1200.')
    expect(sanitizeNumber('12。5', 'integer')).toBe('12.')
    expect(sanitizeNumber('1.2.3', 'integer')).toBe('1.')
    expect(sanitizeNumber('12.', 'integer')).toBe('12.')
    expect(sanitizeNumber('-5.5', 'integer', true)).toBe('-5.')
    expect(sanitizeNumber('12.', 'digits')).toBe('12')
    expect(sanitizeNumber('1200.50', 'digits')).toBe('1200')
  })

  // 逐鍵模擬受控輸入：每一鍵 = 上一輪清洗結果 + 新字元，再清洗（2026-10-28 深度審查 A2）
  const typeKeys = (keys: string, kind: 'decimal' | 'integer' | 'digits', neg = false) =>
    [...keys].reduce((cur, ch) => sanitizeNumber(cur + ch, kind, neg), '')

  it('逐鍵打 1200.5：integer 停在「1200.」，不得接成 12005（金額放大 10 倍）', () => {
    expect(typeKeys('1200.5', 'integer')).toBe('1200.')
    expect(Number(typeKeys('1200.5', 'integer'))).toBe(1200)
    expect(typeKeys('1200.00', 'integer')).toBe('1200.')
    expect(typeKeys('1200.', 'integer')).toBe('1200.')
  })

  it('逐鍵：integer 小數點之後再打點與數字都被擋，退格可回到整數', () => {
    expect(typeKeys('12.3.4', 'integer')).toBe('12.')
    expect(sanitizeNumber('1200', 'integer')).toBe('1200') // 退格刪掉結尾的點
  })

  it('逐鍵：digits 與 decimal 行為不變', () => {
    expect(typeKeys('09.12', 'digits')).toBe('0912')
    expect(typeKeys('1200.5', 'decimal')).toBe('1200.5')
  })

  it('digits 保留前導 0（末五碼、電話）', () => {
    expect(sanitizeNumber('00123', 'digits')).toBe('00123')
    expect(sanitizeNumber('０９１２－３４５', 'digits')).toBe('0912345')
  })

  it('負號只在 allowNegative 且位於開頭時保留', () => {
    expect(sanitizeNumber('-5')).toBe('5')
    expect(sanitizeNumber('-5', 'integer', true)).toBe('-5')
    expect(sanitizeNumber('5-', 'integer', true)).toBe('5')
    expect(sanitizeNumber('－５', 'integer', true)).toBe('-5')
  })

  it('空字串維持空字串（本專案以空字串表示「沒填」）', () => {
    expect(sanitizeNumber('')).toBe('')
    expect(sanitizeNumber('   ')).toBe('')
  })
})
