// tests/notify/createNotify.test.js
// 分級判準測試（自 inknock tests/notify-severity.test.ts 移植）。
//
// 存在的理由是**證明分級有鑑別力**：判準集中在 createNotify 的 refusalCodes，很容易被
// 「順手」加一個碼或改成一律 error 而沒人發現。白名單裡每一個碼都要有案例（inknock
// 第一版只測了 7 個裡的 4 個，少掉的 P0001 被人移除時測試仍全綠——Codex 抓到）。
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createNotify, errText } from '../../src/notify/createNotify.js'
import { toast as rawToast } from '../../src/notify/toast.js'

const REFUSAL_CODES = ['23514', '23505', '23503', '23P01', '42501', '22003', '22023', 'P0001']

describe('createNotify', () => {
  let warn, error, success, notify
  beforeEach(() => {
    warn = vi.spyOn(rawToast, 'warn').mockImplementation(() => {})
    error = vi.spyOn(rawToast, 'error').mockImplementation(() => {})
    success = vi.spyOn(rawToast, 'success').mockImplementation(() => {})
    notify = createNotify({ refusalCodes: REFUSAL_CODES })
  })
  afterEach(() => vi.restoreAllMocks())

  it('toast.success/warn/error 直通套件 toast', () => {
    notify.toast.success('a', { key: 'k' })
    notify.toast.warn('b')
    notify.toast.error('c')
    expect(success).toHaveBeenCalledWith('a', { key: 'k' })
    expect(warn).toHaveBeenCalledWith('b', undefined)
    expect(error).toHaveBeenCalledWith('c', undefined)
  })

  it.each(REFUSAL_CODES)('errcode %s（資料層明確拒絕）→ warn，訊息照原文', (code) => {
    notify.toastFromError({ code, message: `拒絕 ${code}` }, '操作失敗')
    expect(warn).toHaveBeenCalledWith(`拒絕 ${code}`, undefined)
    expect(error).not.toHaveBeenCalled()
  })

  it('沒有 errcode（網路斷線／未預期例外）→ error（停著）', () => {
    notify.toastFromError(new TypeError('Failed to fetch'), '儲存失敗')
    expect(error).toHaveBeenCalledWith('Failed to fetch', undefined)
    expect(warn).not.toHaveBeenCalled()
  })

  it('未知的 errcode → error——白名單之外一律當成「不知道存進去沒」', () => {
    notify.toastFromError({ code: 'PGRST301', message: 'JWT expired' }, '儲存失敗')
    expect(error).toHaveBeenCalled()
    expect(warn).not.toHaveBeenCalled()
  })

  it('取不到訊息時用呼叫端 fallback，再退回 createNotify 的 fallbackMessage', () => {
    notify.toastFromError({}, '建立客戶失敗')
    expect(error).toHaveBeenCalledWith('建立客戶失敗', undefined)
    const n2 = createNotify({ refusalCodes: [], fallbackMessage: '操作失敗' })
    n2.toastFromError({})
    expect(error).toHaveBeenLastCalledWith('操作失敗', undefined)
  })

  it('refusalCodes 空集合 → 什麼都不算拒絕，全部 error', () => {
    const n = createNotify({ refusalCodes: [] })
    n.toastFromError({ code: '23514', message: 'x' }, 'f')
    expect(error).toHaveBeenCalled()
    expect(warn).not.toHaveBeenCalled()
  })

  it('refusalCodes 接受 Set', () => {
    const n = createNotify({ refusalCodes: new Set(['23514']) })
    n.toastFromError({ code: '23514', message: 'x' }, 'f')
    expect(warn).toHaveBeenCalled()
  })
})

describe('errText', () => {
  it('字串本身', () => expect(errText('  hi ', 'f')).toBe('  hi '))
  it('空字串退 fallback', () => expect(errText('   ', 'f')).toBe('f'))
  it('Error 實例的 message', () => expect(errText(new Error('boom'), 'f')).toBe('boom'))
  it('Supabase 純物件：message → details → hint → 錯誤代碼 code', () => {
    expect(errText({ message: 'm', details: 'd' }, 'f')).toBe('m')
    expect(errText({ message: '', details: 'd' }, 'f')).toBe('d')
    expect(errText({ hint: 'h' }, 'f')).toBe('h')
    expect(errText({ code: '23514' }, 'f')).toBe('錯誤代碼 23514')
  })
  it('null／undefined／空物件退 fallback', () => {
    expect(errText(null, 'f')).toBe('f')
    expect(errText(undefined, 'f')).toBe('f')
    expect(errText({}, 'f')).toBe('f')
  })
})
