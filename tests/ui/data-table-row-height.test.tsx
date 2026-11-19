// 2026-11-19 自 inknock tests/data-table-row-height.test.tsx 搬入（inknock ADR 0002 D3 批）；主題改用測試夾具 helpers/test-theme。
// @vitest-environment jsdom
// 表格列高 48（2026-11-15，ADR 0001 D10）：一般列上下 12、左右 16；自訂 rowPadY／dense 照舊。
import { describe, expect, it } from 'vitest'
import { renderWithTheme } from './helpers/test-theme'
import { cleanup } from '@testing-library/react'
import { DataTable } from '../../src/ui/data-table'
import { installMatchMedia } from './helpers/match-media'

installMatchMedia()
const cols = [{ key: 'a', label: 'A', render: (r: { a: string }) => r.a }]
const td = (extra: { dense?: boolean; rowPadY?: number } = {}) => {
  const { container } = renderWithTheme(<DataTable rows={[{ a: 'x' }]} columns={cols} keyOf={r => r.a} {...extra} />)
  return container.querySelector('tbody td') as HTMLElement
}

describe('DataTable 列高', () => {
  it('預設：上下 12、左右 16（內文一行 24 → 列高 48）', () => {
    expect(td().style.padding).toBe('12px 16px')
  })
  it('dense 與 rowPadY 不受影響', () => {
    expect(td({ dense: true }).style.padding).toBe('4px 16px')
    cleanup()
    expect(td({ rowPadY: 7 }).style.padding).toBe('7px 16px')
  })
})
