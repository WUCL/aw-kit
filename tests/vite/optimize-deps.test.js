// @vitest-environment node
// awKitOptimizeDeps：一定帶 exclude aw-kit 與 .tsx 掃描；消費端自己的設定合併、不被覆蓋，也不重複。
// 「真的修好開發伺服器載兩份」由消費端回歸測試證明（inknock tests/vite-dev-single-instance.test.ts，起真的伺服器爬模組圖）。
import { describe, expect, it } from 'vitest'
import { awKitOptimizeDeps } from '../../src/vite/index.js'

describe('awKitOptimizeDeps', () => {
  it('沒有自己的設定：exclude aw-kit、extensions .tsx', () => {
    expect(awKitOptimizeDeps()).toEqual({ exclude: ['aw-kit'], extensions: ['.tsx'] })
  })
  it('有自己的設定：其他欄位保留，exclude／extensions 串接不覆蓋、不重複', () => {
    const r = awKitOptimizeDeps({ include: ['dayjs'], exclude: ['foo', 'aw-kit'], extensions: ['.vue'] })
    expect(r.include).toEqual(['dayjs'])
    expect(r.exclude).toEqual(['foo', 'aw-kit'])
    expect(r.extensions).toEqual(['.vue', '.tsx'])
  })
})
