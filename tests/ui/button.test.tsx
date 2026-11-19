// 2026-11-19 自 inknock tests/button.test.tsx 搬入（inknock ADR 0002 D1 批）
// @vitest-environment jsdom
// Button 包裝層（src/shared/ui/button.tsx，ADR 0001 Button 批次）：對外 props 與舊版相同、事件語意維持原生。
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { Button } from '../../src/ui/button'

import { installMatchMedia } from './helpers/match-media'

// aw-kit 最嚴設定（noUncheckedIndexedAccess）下解構陣列要給 tuple 型別；長度由各測試的 render 決定
type Btns = [HTMLElement, HTMLElement, HTMLElement, HTMLElement]

afterEach(cleanup)

describe('Button 包裝層', () => {
  it('五種 variant 對到 primitive 的樣式名', () => {
    installMatchMedia(false)
    render(<>{(['primary', 'secondary', 'ghost', 'danger', 'cta'] as const).map(v => <Button key={v} variant={v}>{v}</Button>)}</>)
    expect(screen.getAllByRole('button').map(b => b.dataset.variant)).toEqual(['default', 'outline', 'ghost', 'destructive', 'cta'])
  })

  it('預設 type="button"（放在 form 裡不會誤送出）', () => {
    installMatchMedia(false)
    render(<Button>a</Button>)
    expect(screen.getByRole('button').getAttribute('type')).toBe('button')
  })

  it('loading 時停用、換 spinner、不套停用的半透明', () => {
    installMatchMedia(false)
    const onClick = vi.fn()
    render(<Button loading leftIcon={<i data-testid="icon" />} onClick={onClick}>儲存</Button>)
    const b = screen.getByRole('button')
    expect(b.hasAttribute('disabled')).toBe(true)
    expect(screen.queryByTestId('icon')).toBeNull()
    expect(b.className).toContain('disabled:opacity-100')
    fireEvent.click(b)
    expect(onClick).not.toHaveBeenCalled()
  })

  it('停用按鈕保留 title（全站 7 處靠它說明為什麼不能按），且不設 pointer-events-none', () => {
    installMatchMedia(false)
    render(<Button disabled title="需等該月結束後才能封存">封存</Button>)
    const b = screen.getByRole('button')
    expect(b.getAttribute('title')).toBe('需等該月結束後才能封存')
    expect(b.className).not.toContain('disabled:pointer-events-none')
  })

  it('次要按鈕停用：淡字勝出（outline 加了 text-foreground，2026-11-13 review），不可兩個字色並存', () => {
    installMatchMedia(false)
    render(<Button variant="secondary" disabled>次要</Button>)
    const sc = screen.getByRole('button', { name: '次要' }).className.split(' ')
    expect(sc).toContain('text-ink-faint')
    expect(sc).not.toContain('text-foreground')
  })

  it('停用：白底＋lineStrong 框＋淡字（不用半透明）；ghost 只降字色；載入中不套', () => {
    installMatchMedia(false)
    render(<><Button disabled>主要</Button><Button variant="ghost" disabled>幽靈</Button><Button loading>載入</Button></>)
    const [p, g, l] = screen.getAllByRole('button') as Btns
    for (const c of ['bg-background', 'border-line-strong', 'text-ink-faint', 'disabled:opacity-100']) expect(p.className, c).toContain(c)
    expect(p.className).not.toContain('bg-primary ')
    expect(g.className).toContain('text-ink-faint')
    expect(g.className).not.toContain('border-line-strong')
    expect(l.className).not.toContain('border-line-strong')
    expect(l.className).toContain('bg-primary')
  })

  it('可點範圍至少 44px（after 偽元素往上下擴）', () => {
    installMatchMedia(false)
    render(<Button size="sm">sm</Button>)
    expect(screen.getByRole('button').className).toContain('after:inset-y-[min(0px,calc((100%_-_44px)/2))]')
  })

  // 2026-11-13 方案 B：取消手機升 lg（ADR 0001〈外觀定案〉D13），手機與桌機同一個高度 class
  it('手機時 md 不升 lg，sm 不動', () => {
    installMatchMedia(true)
    render(<><Button>md</Button><Button size="sm">sm</Button></>)
    const [md, sm] = screen.getAllByRole('button') as Btns
    expect(md.className).toContain('h-(--control-h-md)')
    expect(md.className).not.toContain('h-(--control-h-lg)')
    expect(sm.className).toContain('h-(--control-h-sm)')
    expect(sm.className).not.toContain('h-(--control-h-lg)')
  })

  it('桌機時 md 維持 md', () => {
    installMatchMedia(false)
    render(<Button>md</Button>)
    const c = screen.getByRole('button').className
    expect(c).toContain('h-(--control-h-md)')
    expect(c).not.toContain('h-(--control-h-lg)')
  })

  // React Aria 的 Button 會對 mousedown／click 呼叫 stopPropagation：document 上「點外面就關閉」的監聽
  // （overflow-menu、header-dropdown、period-picker、info-tip）在點到按鈕時收不到。換成它這條會紅。
  it('mousedown／click 會冒泡到 document（點外面關選單仍有效）', () => {
    installMatchMedia(false)
    const onDocDown = vi.fn(); const onDocClick = vi.fn(); const onClick = vi.fn()
    document.addEventListener('mousedown', onDocDown)
    document.addEventListener('click', onDocClick)
    try {
      render(<Button onClick={onClick}>按我</Button>)
      const b = screen.getByRole('button')
      fireEvent.mouseDown(b); fireEvent.mouseUp(b); fireEvent.click(b)
      expect(onClick).toHaveBeenCalledTimes(1)
      expect(onDocDown).toHaveBeenCalledTimes(1)
      expect(onDocClick).toHaveBeenCalledTimes(1)
    } finally {
      document.removeEventListener('mousedown', onDocDown)
      document.removeEventListener('click', onDocClick)
    }
  })

  // 2026-11-18 第 28 批：primitives 的 has-data-[icon=…]:pl／pr（圖示側內距 sm 6、md／lg 8）從沒生效過，
  // 因為包裝層輸出圖示時沒有任何元素帶 data-icon。jsdom 算不出 Tailwind padding，所以測 DOM 屬性（CSS 的 :has 靠它）＋ class 配對。
  describe('圖示側內距（data-icon）', () => {
    const icon = <svg data-testid="i" width="16" height="16" />
    it.each(['sm', 'md', 'lg'] as const)('%s：左圖示帶 data-icon="inline-start"、右圖示帶 "inline-end"，圖示是 span 的子元素', size => {
      installMatchMedia(false)
      render(<Button size={size} leftIcon={icon} rightIcon={<i data-testid="r" />}>字</Button>)
      const b = screen.getByRole('button')
      expect(b.querySelector('[data-icon="inline-start"]')?.contains(screen.getByTestId('i'))).toBe(true)
      expect(b.querySelector('[data-icon="inline-end"]')?.contains(screen.getByTestId('r'))).toBe(true)
      expect(b.querySelectorAll('[data-icon]').length).toBe(2)
    })
    it('包裝 span 不產生盒子（class contents），圖示與文字的順序不變', () => {
      installMatchMedia(false)
      render(<Button leftIcon={icon} rightIcon={<i data-testid="r" />}>字</Button>)
      const b = screen.getByRole('button')
      expect(Array.from(b.children).map(c => c.getAttribute('data-icon'))).toEqual(['inline-start', 'inline-end'])
      expect(b.querySelector('[data-icon]')!.className).toBe('contents')
      expect(b.textContent).toBe('字')
    })
    it('沒傳圖示：不輸出任何 data-icon（空 span 也會讓 :has 命中、把內距縮掉）', () => {
      installMatchMedia(false)
      render(<><Button>無圖示</Button><Button leftIcon={null} rightIcon={false}>空值</Button></>)
      expect(document.querySelectorAll('[data-icon]').length).toBe(0)
    })
    it('載入中寬度不跳：sm 有左圖示 → spinner 沿用圖示側（6＋14＝6＋14）；md／lg → 不帶（10＋14＝8＋16）；沒左圖示 → 不帶', () => {
      installMatchMedia(false)
      render(<>
        <Button size="sm" loading leftIcon={icon}>a</Button>
        <Button size="md" loading leftIcon={icon}>b</Button>
        <Button size="lg" loading leftIcon={icon}>c</Button>
        <Button size="sm" loading>d</Button>
      </>)
      const [a, b, c, d] = screen.getAllByRole('button') as Btns
      expect(a.querySelector('[data-icon="inline-start"] svg')).not.toBeNull()
      for (const x of [b, c, d]) { expect(x.querySelector('[data-icon]')).toBeNull(); expect(x.querySelector('svg')).not.toBeNull() }
    })
    it('primitive 的內距規則與 data-icon 值配對：sm 6（pl-1.5／pr-1.5）、md／lg 8（pl-2／pr-2）', () => {
      installMatchMedia(false)
      render(<>{(['sm', 'md', 'lg'] as const).map(z => <Button key={z} size={z}>{z}</Button>)}</>)
      const [sm, md, lg] = screen.getAllByRole('button').map(b => b.className) as [string, string, string]
      expect(sm).toContain('has-data-[icon=inline-start]:pl-1.5'); expect(sm).toContain('has-data-[icon=inline-end]:pr-1.5')
      for (const c of [md, lg]) { expect(c).toContain('has-data-[icon=inline-start]:pl-2'); expect(c).toContain('has-data-[icon=inline-end]:pr-2') }
    })
  })
})
