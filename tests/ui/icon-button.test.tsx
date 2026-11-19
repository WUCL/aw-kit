// 2026-11-19 自 inknock tests/icon-button.test.tsx 搬入（inknock ADR 0002 D3 批）；主題改用測試夾具 helpers/test-theme。
// @vitest-environment jsdom
// IconButton 換新（2026-11-16，使用者看比較頁「確認」＝四點照建議）：
// - 外觀走 Button 同一套 class（buttonVariants）；停用＝Button 的停用樣子，不再整顆半透明（mockup 106 否決的寫法）
// - 透明鈕（ghost）＝Button ghost（符號中灰）；「＋新增預約」＝primary；灰底 sunken 保留（手機行事曆）
// - ⋯ 展開中的灰底由元件依 aria-expanded 畫，呼叫端不再蓋 style
// - 按鈕 class 會把沒指定尺寸的 svg 放大成 16：IconButton 把寬 12／14 的 svg 對應回 size-3／size-3.5（review：桌機行事曆 ‹ › 被放大；補審：不用 size-auto）
import { renderWithTheme } from './helpers/test-theme'
import upstream from '../../src/ui/primitives/button.tsx?raw'
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { installMatchMedia } from './helpers/match-media'
installMatchMedia(false)
import { IconButton } from '../../src/ui/icon-button'
import { CloseIcon } from '../../src/ui/close-icon'
import { OverflowMenu } from '../../src/ui/overflow-menu'
import { DISABLED_GHOST, DISABLED_LOOK } from '../../src/ui/button'

const has = (el: HTMLElement, cls: string) => cls.split(' ').every(c => el.className.split(/\s+/).includes(c))

describe('IconButton', () => {
  it('名字＝label（aria-label＋title），走 Button 的 class，沒有 inline 外觀', () => {
    render(<IconButton label="更多">⋯</IconButton>)
    const b = screen.getByRole('button', { name: '更多' })
    expect(b.title).toBe('更多')
    expect(b.dataset.slot).toBe('button')
    expect(has(b, 'size-(--control-h-md) border-input')).toBe(true)
    expect(b.getAttribute('style')).toBeNull()
  })

  it('不帶 data-icon（圖示側內距規則只屬於有文字的 Button；方形鈕不可被命中，第 28 批）', () => {
    render(<IconButton label="更多"><svg width="14" height="14" /></IconButton>)
    expect(screen.getByRole('button', { name: '更多' }).querySelector('[data-icon]')).toBeNull()
  })

  it('停用：外框鈕＝白底灰框淡字、透明鈕＝只降字色；都不是半透明', () => {
    render(<><IconButton label="a" disabled>‹</IconButton><IconButton label="b" variant="ghost" disabled>›</IconButton><IconButton label="c" variant="ghost">›</IconButton></>)
    const a = screen.getByRole('button', { name: 'a' }), b = screen.getByRole('button', { name: 'b' }), c = screen.getByRole('button', { name: 'c' })
    expect(has(a, DISABLED_LOOK)).toBe(true)
    expect(has(b, DISABLED_GHOST)).toBe(true)
    expect(has(c, DISABLED_GHOST)).toBe(false)
    for (const el of [a, b]) expect(el.style.opacity).toBe('')
  })

  it('尺寸：xs／sm＝28（xs 圓角小一階）、md 32、lg 36；變體對應 Button', () => {
    render(<>
      <IconButton label="xs" size="xs" variant="ghost">×</IconButton>
      <IconButton label="sm" size="sm">‹</IconButton>
      <IconButton label="lg" size="lg">‹</IconButton>
      <IconButton label="sunk" variant="sunken">‹</IconButton>
      <IconButton label="add" variant="primary">+</IconButton>
    </>)
    expect(has(screen.getByRole('button', { name: 'xs' }), 'size-(--control-h-sm) rounded-sm')).toBe(true)
    expect(has(screen.getByRole('button', { name: 'sm' }), 'size-(--control-h-sm)')).toBe(true)
    expect(has(screen.getByRole('button', { name: 'sm' }), 'rounded-sm')).toBe(false)
    expect(has(screen.getByRole('button', { name: 'lg' }), 'size-(--control-h-lg)')).toBe(true)
    expect(has(screen.getByRole('button', { name: 'sunk' }), 'bg-surface-sunken hover:bg-muted')).toBe(true)
    expect(screen.getByRole('button', { name: 'add' }).dataset.variant).toBe('primary')
    expect(has(screen.getByRole('button', { name: 'add' }), 'bg-primary')).toBe(true)
  })

  it('svg 寬 12／14 對應到固定尺寸 class，且只對沒有自帶 size- 的 svg；上游放大規則的寫法沒變（變了要重驗權重）', () => {
    render(<IconButton label="關閉" variant="ghost"><CloseIcon size={12} /></IconButton>)
    const cls = screen.getByRole('button', { name: '關閉' }).className.split(/\s+/)
    expect(cls).toContain("[&_svg[width='12']:not([class*='size-'])]:size-3")
    expect(cls).toContain("[&_svg[width='14']:not([class*='size-'])]:size-3.5")
    expect(cls).not.toContain('[&_svg[width][height]]:size-auto')
    // 本元件的選擇器權重（svg＋兩個屬性／偽類）要高過上游這條（svg＋一個偽類）；上游改寫法時這裡會紅、提醒重驗。
    // jsdom 不算 CSS，實際尺寸已在真瀏覽器量過（12／14 維持原尺寸）。
    expect(upstream).toContain("[&_svg:not([class*='size-'])]:size-4")
  })
  it('灰底鈕標成 sunken（不混進 ghost）；停用保留灰底、只降字色（不變成白底外框鈕）', () => {
    render(<><IconButton label="前一天" variant="sunken">‹</IconButton><IconButton label="停用" variant="sunken" disabled>‹</IconButton></>)
    expect(screen.getByRole('button', { name: '前一天' }).dataset.variant).toBe('sunken')
    const d = screen.getByRole('button', { name: '停用' })
    expect(has(d, 'bg-surface-sunken text-ink-faint')).toBe(true)
    expect(has(d, 'bg-background')).toBe(false)
    expect(has(d, 'border-line-strong')).toBe(false)
  })
})

describe('remove（刪除用的透明鈕）', () => {
  it('滑過符號變紅；停用只降字色（DISABLED_GHOST 蓋過紅色 hover）、不半透明', () => {
    render(<><IconButton label="刪除" variant="remove">×</IconButton><IconButton label="不能刪" variant="remove" disabled>×</IconButton></>)
    const on = screen.getByRole('button', { name: '刪除' })
    const off = screen.getByRole('button', { name: '不能刪' })
    expect(has(on, 'hover:text-danger-ink')).toBe(true)
    expect(off.style.opacity).toBe('')
    expect(has(off, DISABLED_GHOST)).toBe(true)
    expect(has(off, 'hover:text-danger-ink')).toBe(false)  // tailwind-merge 以後寫的 hover:text-ink-faint 為準
  })
})

describe('OverflowMenu 觸發鈕', () => {
  it('展開中靠 aria-expanded 畫灰底，不再由呼叫端蓋 inline 背景', () => {
    renderWithTheme(<OverflowMenu label="更多" items={[{ label: '編輯', onClick: vi.fn() }]} />)
    const t = screen.getByRole('button', { name: '更多' })
    fireEvent.click(t)
    expect(t.getAttribute('aria-expanded')).toBe('true')
    expect(t.style.background).toBe('')
    expect(t.className).toContain('aria-expanded:bg-muted')
  })
})
