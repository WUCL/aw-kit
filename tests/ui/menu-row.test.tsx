// 2026-11-19 自 inknock tests/menu-row.test.tsx 搬入（inknock ADR 0002 D3 批）；主題改用測試夾具 helpers/test-theme。
// @vitest-environment jsdom
// MenuRow／MenuLabel／MenuSeparator（2026-11-18 第 28 批）：標題列下拉與 OverflowMenu／PeriodPicker 共用的選單列外觀。
// 外觀以比較頁實看；這裡守結構：class 組合、多行變體真的蓋掉固定列高、危險項、button／link 兩種形態、不偷加語意。
import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { Link, MemoryRouter } from 'react-router-dom'
import { MenuLabel, MenuRow, MenuSeparator } from '../../src/ui/menu-row'
import {
  menuItemClassName, menuItemDangerClassName, menuItemSelectedClassName, menuLabelClassName, menuSeparatorClassName,
} from '../../src/ui/primitives/dropdown-menu'

const classes = (el: HTMLElement) => el.className.split(/\s+/)

describe('MenuRow（button）', () => {
  it('預設＝選單列 class 原樣、帶 data-slot、type=button、不加 role', () => {
    render(<MenuRow>登出</MenuRow>)
    const el = screen.getByText('登出')
    expect(el.tagName).toBe('BUTTON')
    expect(el.className).toBe(menuItemClassName)
    expect(el.getAttribute('type')).toBe('button')
    expect(el.dataset.slot).toBe('dropdown-menu-item')
    expect(el.hasAttribute('role')).toBe(false)
  })

  it('multiline：改成至少 44 高，固定列高被蓋掉（不能兩個高度並存）', () => {
    render(<MenuRow multiline>多行</MenuRow>)
    const c = classes(screen.getByText('多行'))
    expect(c).toContain('min-h-(--row-h-touch)')
    expect(c).toContain('h-auto')
    expect(c).not.toContain('h-(--row-h-touch)')
  })

  it('align=start 蓋掉置中；沒傳維持置中', () => {
    render(<><MenuRow align="start">頂</MenuRow><MenuRow>中</MenuRow></>)
    const top = classes(screen.getByText('頂'))
    expect(top).toContain('items-start')
    expect(top).not.toContain('items-center')
    expect(classes(screen.getByText('中'))).toContain('items-center')
  })

  it('danger：加危險 class；selected：加字重', () => {
    render(<><MenuRow danger>刪除</MenuRow><MenuRow selected>已選</MenuRow></>)
    expect(screen.getByText('刪除').className).toContain(menuItemDangerClassName.split(' ')[0])
    expect(screen.getByText('已選').className).toContain(menuItemSelectedClassName)
    expect(screen.getByText('已選').className).not.toContain(menuItemDangerClassName.split(' ')[0])
  })

  it('onClick 會被呼叫；disabled 時不觸發', () => {
    const onClick = vi.fn()
    render(<><MenuRow onClick={onClick}>可點</MenuRow><MenuRow disabled onClick={onClick}>停用</MenuRow></>)
    fireEvent.click(screen.getByText('可點'))
    expect(onClick).toHaveBeenCalledTimes(1)
    fireEvent.click(screen.getByText('停用'))
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('role／aria 由呼叫端傳入（OverflowMenu／PeriodPicker 用）', () => {
    render(<MenuRow role="menuitemradio" aria-checked>本週</MenuRow>)
    expect(screen.getByRole('menuitemradio').getAttribute('aria-checked')).toBe('true')
  })
})

describe('MenuRow（link）', () => {
  it('傳 to＋linkAs（消費端的 Link）→ <a>，同樣的外觀 class 與 data-slot，點擊事件照傳', () => {
    const onClick = vi.fn()
    render(<MemoryRouter><MenuRow to="/app/dashboard" linkAs={Link} danger multiline onClick={onClick}>看數字</MenuRow></MemoryRouter>)
    const a = screen.getByText('看數字')
    expect(a.tagName).toBe('A')
    expect(a.getAttribute('href')).toBe('/app/dashboard')
    expect(a.dataset.slot).toBe('dropdown-menu-item')
    expect(classes(a)).toContain('min-h-(--row-h-touch)')
    expect(a.className).toContain(menuItemDangerClassName.split(' ')[0])
    fireEvent.click(a)
    expect(onClick).toHaveBeenCalledTimes(1)
  })
})

describe('MenuLabel／MenuSeparator', () => {
  it('標籤帶選單小標 class 與 id', () => {
    render(<MenuLabel id="g1">至今</MenuLabel>)
    const el = screen.getByText('至今')
    expect(el.id).toBe('g1')
    expect(el.className).toBe(menuLabelClassName)
  })

  it('分隔線：預設 role=separator；decorative 只畫線、不進無障礙樹', () => {
    const { container } = render(<><MenuSeparator /><MenuSeparator decorative /></>)
    const [a, b] = Array.from(container.children) as HTMLElement[]
    expect(a.getAttribute('role')).toBe('separator')
    expect(a.className).toBe(menuSeparatorClassName)
    expect(b.hasAttribute('role')).toBe(false)
    expect(b.getAttribute('aria-hidden')).toBe('true')
    expect(b.className).toBe(menuSeparatorClassName)
  })
})
