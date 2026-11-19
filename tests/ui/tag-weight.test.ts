// 2026-11-19 自 inknock tests/tag-weight.test.ts 搬入（inknock ADR 0002 D3 批）；主題改用測試夾具 helpers/test-theme。
// 標籤字重統一（2026-11-15 使用者定案）：屬性標記一族（Chip、Badge 的 marker／attribute）500；狀態與分級 Badge 600。
// 換之前 Chip 500、Badge 屬性 600，外觀其餘都一樣只差字重。
import { describe, expect, it } from 'vitest'
import { badgeVariants } from '../../src/ui/primitives/badge'
import { chipVariants, removableChipClassName } from '../../src/ui/primitives/chip'

const weight = (cls: string) => cls.split(/\s+/).filter(c => /^font-(medium|semibold|bold|normal)$/.test(c))

describe('標籤字重', () => {
  it.each(['marker', 'attribute'] as const)('Badge %s＝500（與 Chip 同一族）', tone => {
    expect(weight(badgeVariants({ tone }))).toEqual(['font-medium'])
  })
  it.each(['neutral', 'warning', 'danger', 'done', 'tier-new', 'tier-returning'] as const)('Badge %s（狀態／分級）＝600', tone => {
    expect(weight(badgeVariants({ tone }))).toEqual(['font-semibold'])
  })
  it('Chip 各款＝500', () => {
    expect(weight(chipVariants({}))).toEqual(['font-medium'])
    expect(weight(chipVariants({ tone: 'accent', size: 'md' }))).toEqual(['font-medium'])
    expect(weight(removableChipClassName)).toEqual(['font-medium'])
  })
})
