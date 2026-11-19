// aw-kit/ui/theme-context 的兩個約定（inknock DECISIONS 2026-11-19）：
// ① 沒包 ThemeProvider 時 useTheme() 直接丟錯（沒有預設主題）② --focus-ring 只由最外層寫、跟著 accent600，最外層卸載時移除。
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render } from '@testing-library/react'
import { ThemeProvider, useTheme } from '../../src/ui/theme-context'
import type { Theme } from '../../src/ui/theme'

afterEach(() => { cleanup(); document.documentElement.style.removeProperty('--focus-ring') })
// 只用到 accent600：測試主題夾具（完整的 createThemeFactory 品牌）等 D3 元件測試一起做
const theme = (accent600: string) => ({ accent600 }) as unknown as Theme
const ring = () => document.documentElement.style.getPropertyValue('--focus-ring')
function Probe() { return <i data-accent={useTheme().accent600} /> }

describe('theme-context', () => {
  it('沒包 ThemeProvider：useTheme() 丟錯，訊息指出要包 Provider', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(() => render(<Probe />)).toThrow(/ThemeProvider/)
    spy.mockRestore()
  })
  it('包了：拿到傳入的主題', () => {
    const { container } = render(<ThemeProvider theme={theme('#112233')}><Probe /></ThemeProvider>)
    expect(container.querySelector('i')?.getAttribute('data-accent')).toBe('#112233')
  })
  it('--focus-ring 跟著 accent600 更新', () => {
    const { rerender } = render(<ThemeProvider theme={theme('#112233')}><Probe /></ThemeProvider>)
    expect(ring()).toBe('#112233')
    rerender(<ThemeProvider theme={theme('#445566')}><Probe /></ThemeProvider>)
    expect(ring()).toBe('#445566')
  })
  it('巢狀 Provider 只提供 context、不碰焦點環（全站一份，只有最外層寫）；最外層卸載後清掉', () => {
    const Nested = ({ inner }: { inner: boolean }) => (
      <ThemeProvider theme={theme('#112233')}>{inner && <ThemeProvider theme={theme('#AA0000')}><Probe /></ThemeProvider>}</ThemeProvider>
    )
    const { container, rerender, unmount } = render(<Nested inner />)
    expect(container.querySelector('i')?.getAttribute('data-accent')).toBe('#AA0000')
    expect(ring()).toBe('#112233')
    rerender(<Nested inner={false} />)
    expect(ring()).toBe('#112233')
    // 外層已掛載後才掛內層：內層的 effect 單獨跑——若每層都寫，全站焦點環會變成 #AA0000
    rerender(<Nested inner />)
    expect(ring()).toBe('#112233')
    unmount()
    expect(ring()).toBe('')
  })
})
