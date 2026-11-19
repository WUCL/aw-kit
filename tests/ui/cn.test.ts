// src/ui/cn.ts：共用層的字級與情境間距要被 cn 認得（2026-11-19 自 inknock tests/cn.test.ts 搬入）。
import { describe, expect, it } from 'vitest'
import { createCn } from 'cn/config'
import { cn } from '../../src/ui/cn'

// 未擴充的 createCn＝套件預設行為（`cn/engine` 的型別宣稱有 cn、執行期實際沒有）
const stockCn = createCn()

describe('cn（aw-kit/ui createCn）', () => {
  it('陰性對照：預設 cn 會把 text-meta 當顏色吃掉（證明需要自訂）', () => {
    expect(stockCn('text-meta', 'text-ink-muted')).toBe('text-ink-muted')
  })
  it('字級與顏色並存', () => {
    expect(cn('text-meta', 'text-ink-muted')).toBe('text-meta text-ink-muted')
    expect(cn('text-sm', 'text-muted-foreground')).toBe('text-sm text-muted-foreground')
  })
  it('字級彼此覆寫（後者勝）', () => {
    expect(cn('text-sm', 'text-caption')).toBe('text-caption')
    expect(cn('text-meta', 'text-page-title')).toBe('text-page-title')
  })
  it('情境間距與數字刻度彼此覆寫', () => {
    expect(cn('p-4', 'p-card')).toBe('p-card')
    expect(cn('gap-stack', 'gap-2')).toBe('gap-2')
    expect(cn('px-input-x', 'px-2.5')).toBe('px-2.5')
  })
  it('是自家 cn，不是套件預設', () => {
    expect(cn).not.toBe(stockCn)
  })
})
