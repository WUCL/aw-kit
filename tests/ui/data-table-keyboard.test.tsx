// 2026-11-19 自 inknock tests/data-table-keyboard.test.tsx 搬入（inknock ADR 0002 D3 批）；主題改用測試夾具 helpers/test-theme。
// @vitest-environment jsdom
//
// DataTable 可點列的鍵盤操作（2026-10-08）：列本身聚焦按 Enter／空白鍵 → onRowClick；
// 列內的按鈕按 Enter 不可被列攔走（第二輪 review：原本 preventDefault 讓按鈕自己的 click 失效）。
import { ThemeProvider } from '../../src/ui/theme-context'
import { testTheme } from './helpers/test-theme'
import { describe, it, expect, vi } from 'vitest'
import { render, fireEvent, screen } from '@testing-library/react'
import { installMatchMedia } from './helpers/match-media'
installMatchMedia(false)
import { DataTable } from '../../src/ui/data-table'


function setup() {
  const onRowClick = vi.fn()
  const onBtn = vi.fn()
  render(<ThemeProvider theme={testTheme}><DataTable
    rows={[{ id: 'a', name: '剪髮' }]}
    keyOf={r => r.id}
    onRowClick={onRowClick}
    columns={[{ key: 'n', label: '名稱', render: r => <span>{r.name}<button type="button" onClick={onBtn}>內部</button></span> }]}
  /></ThemeProvider>)
  const row = screen.getByText('剪髮').closest('[tabindex="0"]') as HTMLElement
  return { onRowClick, onBtn, row, btn: screen.getByText('內部') }
}

describe('DataTable 鍵盤', () => {
  it('可點列可以聚焦，Enter 與空白鍵觸發 onRowClick', () => {
    const { onRowClick, row } = setup()
    expect(row).toBeTruthy()
    fireEvent.keyDown(row, { key: 'Enter', code: 'Enter', keyCode: 13 })
    fireEvent.keyDown(row, { key: ' ', code: 'Space', keyCode: 32 })
    expect(onRowClick).toHaveBeenCalledTimes(2)
  })
  it('列內按鈕上的 Enter 不觸發整列', () => {
    const { onRowClick, btn } = setup()
    fireEvent.keyDown(btn, { key: 'Enter', code: 'Enter', keyCode: 13 })
    expect(onRowClick).not.toHaveBeenCalled()
  })
})
