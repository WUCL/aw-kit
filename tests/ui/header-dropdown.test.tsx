// 2026-11-19 自 inknock tests/header-dropdown.test.tsx 搬入（inknock ADR 0002 D3 批）；主題改用測試夾具 helpers/test-theme。
// @vitest-environment jsdom
// HeaderDropdown：桌機維持原寬度的浮框；手機滿版＋遮罩；遮罩／Esc／點外側收起。
import { useRef, type ReactElement } from 'react'
import { ThemeProvider } from '../../src/ui/theme-context'
import { testTheme } from './helpers/test-theme'
import { describe, it, expect, vi } from 'vitest'
import { render, fireEvent } from '@testing-library/react'
import { installMatchMedia } from './helpers/match-media'
import { MemoryRouter, useLocation, useNavigate } from 'react-router-dom'
import { HeaderDropdown } from '../../src/ui/header-dropdown'
import { menuContentClassName } from '../../src/ui/primitives/dropdown-menu'


function GoBtn() {
  const nav = useNavigate()
  return <button data-testid="go" onClick={() => nav('/other')}>換頁</button>
}

function setup(mobile: boolean) {
  installMatchMedia(mobile)
  const onClose = vi.fn()
  function C() {
    const ref = useRef<HTMLDivElement>(null)
    // 路由由消費端給（aw-kit 不依賴路由套件）：這裡模擬 inknock 的轉接層，把 pathname＋search 當 routeKey
    const { pathname, search } = useLocation()
    return (
      <header>
        <div ref={ref} style={{ position: 'relative' }}>
          <HeaderDropdown open onClose={onClose} anchorRef={ref} width={320} label="測試" routeKey={pathname + search}><span>內容</span></HeaderDropdown>
        </div>
        <button>外面</button>
        <GoBtn />
      </header>
    )
  }
  render(<ThemeProvider theme={testTheme}><MemoryRouter><C /></MemoryRouter></ThemeProvider>)
  return onClose
}
const esc = () => fireEvent.keyDown(document, { key: 'Escape', code: 'Escape', keyCode: 27 })

describe('HeaderDropdown 桌機', () => {
  it('浮框 absolute、寬度為傳入值、無遮罩', () => {
    setup(false)
    const box = document.body.querySelector('header div div') as HTMLElement
    expect(box.style.position).toBe('absolute')
    expect(box.style.width).toBe('320px')
    expect(box.style.right).toBe('0px')
    expect(document.querySelector('[data-testid="header-dropdown-mask"]')).toBeNull()
  })
  it('桌機容器用選單外觀 class（淡環＋陰影），不再手刻框線／陰影／底色；不是 menu、沒有 role', () => {
    setup(false)
    const box = document.body.querySelector('header div div') as HTMLElement
    expect(box.className).toContain(menuContentClassName)
    expect(box.style.border).toBe('')
    expect(box.style.boxShadow).toBe('')
    expect(box.style.background).toBe('')
    expect(box.hasAttribute('role')).toBe(false)
  })
  it('Esc 收起；組字中的 Esc 不收', () => {
    const onClose = setup(false)
    fireEvent.keyDown(document, { key: 'Escape', isComposing: true, keyCode: 229 })
    expect(onClose).not.toHaveBeenCalled()
    esc()
    expect(onClose).toHaveBeenCalledTimes(1)
  })
  it('點外側收起、點內部不收', () => {
    const onClose = setup(false)
    fireEvent.mouseDown(document.body.querySelector('span')!)
    expect(onClose).not.toHaveBeenCalled()
    fireEvent.mouseDown(document.body.querySelector('button')!)
    expect(onClose).toHaveBeenCalledTimes(1)
  })
})

describe('HeaderDropdown 手機', () => {
  it('滿版 fixed（左右貼齊、無圓角、最高 70vh）＋遮罩', () => {
    setup(true)
    const sheet = document.querySelector('[data-testid="header-dropdown-sheet"]') as HTMLElement
    expect(sheet.style.position).toBe('fixed')
    expect(sheet.style.left).toBe('0px')
    expect(sheet.style.right).toBe('0px')
    expect(sheet.style.maxHeight).toBe('70vh')
    expect(sheet.style.borderRadius).toBe('')
    expect(sheet.className).not.toContain('rounded') // 手機容器不變：不換成選單的圓角／環
    expect(sheet.firstElementChild?.className).toBe('p-1') // 內容包一層內距，列與桌機一致
    expect(sheet.parentElement).toBe(document.body)
    expect(document.querySelector('[data-testid="header-dropdown-mask"]')).not.toBeNull()
  })
  it('點遮罩收起；Esc 收起；點浮框內部（portal）不收', () => {
    const onClose = setup(true)
    fireEvent.mouseDown(document.querySelector('[data-testid="header-dropdown-sheet"] span')!)
    expect(onClose).not.toHaveBeenCalled()
    fireEvent.click(document.querySelector('[data-testid="header-dropdown-mask"]')!)
    expect(onClose).toHaveBeenCalledTimes(1)
    esc()
    expect(onClose).toHaveBeenCalledTimes(2)
  })
  it('點標題列 anchor 外的其他按鈕會收（手機也要有點外側）', () => {
    const onClose = setup(true)
    fireEvent.mouseDown(document.querySelector('header button')!)
    expect(onClose).toHaveBeenCalledTimes(1)
  })
  it('點 portal 內部不收', () => {
    const onClose = setup(true)
    fireEvent.mouseDown(document.querySelector('[data-testid="header-dropdown-sheet"]')!)
    expect(onClose).not.toHaveBeenCalled()
  })
  it('換路由會收', () => {
    const onClose = setup(true)
    expect(onClose).not.toHaveBeenCalled()
    fireEvent.click(document.querySelector('[data-testid="go"]')!)
    expect(onClose).toHaveBeenCalled()
  })
  it('換路由會收（桌機也一樣）', () => {
    const onClose = setup(false)
    fireEvent.click(document.querySelector('[data-testid="go"]')!)
    expect(onClose).toHaveBeenCalled()
  })
  describe('routeKey 合約（路由由消費端給）', () => {
    function Harness({ open, routeKey, onClose }: { open: boolean; routeKey: string | null; onClose: () => void }) {
      const ref = useRef<HTMLDivElement>(null)
      return <div ref={ref}><HeaderDropdown open={open} onClose={onClose} anchorRef={ref} width={320} label="測試" routeKey={routeKey}><span>內容</span></HeaderDropdown></div>
    }
    const r = (ui: ReactElement) => <ThemeProvider theme={testTheme}>{ui}</ThemeProvider>
    it('routeKey={null}：值不會變，換頁不收', () => {
      installMatchMedia(false)
      const onClose = vi.fn()
      const { rerender } = render(r(<Harness open routeKey={null} onClose={onClose} />))
      rerender(r(<Harness open routeKey={null} onClose={onClose} />))
      expect(onClose).not.toHaveBeenCalled()
    })
    it('關著的時候換頁、之後再打開：不會一打開就被收起', () => {
      installMatchMedia(false)
      const onClose = vi.fn()
      const { rerender } = render(r(<Harness open={false} routeKey="/a" onClose={onClose} />))
      rerender(r(<Harness open={false} routeKey="/b" onClose={onClose} />))
      rerender(r(<Harness open routeKey="/b" onClose={onClose} />))
      expect(onClose).not.toHaveBeenCalled()
      rerender(r(<Harness open routeKey="/c" onClose={onClose} />))
      expect(onClose).toHaveBeenCalledTimes(1)
    })
  })
  it('無障礙：dialog／aria-modal／aria-label，開啟時焦點進浮框，關閉回觸發鈕', () => {
    installMatchMedia(true)
    function C({ open }: { open: boolean }) {
      const ref = useRef<HTMLDivElement>(null)
      return (
        <header><div ref={ref}><button data-testid="trg">觸發</button>
          <HeaderDropdown open={open} onClose={() => {}} anchorRef={ref} width={320} label="通知" routeKey={null}><span>內容</span></HeaderDropdown>
        </div></header>
      )
    }
    const { rerender } = render(<ThemeProvider theme={testTheme}><MemoryRouter><C open={false} /></MemoryRouter></ThemeProvider>)
    const trg = document.querySelector('[data-testid="trg"]') as HTMLElement
    trg.focus()
    rerender(<ThemeProvider theme={testTheme}><MemoryRouter><C open /></MemoryRouter></ThemeProvider>)
    const sheet = document.querySelector('[data-testid="header-dropdown-sheet"]') as HTMLElement
    expect(sheet.getAttribute('role')).toBe('dialog')
    expect(sheet.getAttribute('aria-modal')).toBe('true')
    expect(sheet.getAttribute('aria-label')).toBe('通知')
    expect(document.activeElement).toBe(sheet)
    rerender(<ThemeProvider theme={testTheme}><MemoryRouter><C open={false} /></MemoryRouter></ThemeProvider>)
    expect(document.activeElement).toBe(trg)
  })
})
