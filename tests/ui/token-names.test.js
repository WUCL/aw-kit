// @vitest-environment node
// src/ui/internal/token-names.generated.ts 必須與共用層（BASE）同步——cn 認得的字級／間距名單由它決定。
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { BASE, renderNames } from '../../src/design-tokens/index.js'
import { OUT, expected, HEADER } from '../../scripts/gen-ui-names.mjs'

describe('token-names.generated.ts', () => {
  it('與共用層產生結果逐字相同（不同步跑 npm run gen:ui-names）', () => {
    expect(readFileSync(OUT, 'utf8')).toBe(expected())
  })
  it('陰性對照：共用層多一個字級，產生結果就不同', () => {
    const fm = { ...BASE, typography: { ...BASE.typography, huge: { fontSize: '99px' } } }
    expect(renderNames(fm, { header: HEADER })).not.toBe(expected())
  })
})
