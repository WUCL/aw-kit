// aw-kit 測試用主題夾具（2026-11-19 D3 批）：主題 context 沒有預設值，渲染讀主題的元件時要包 ThemeProvider。
// 色值是測試用的假值（不是任何品牌）；ThemeColors 多一個鍵時這裡型別檢查會紅，不會靜默缺值。
import type { ReactNode } from 'react'
import { render, type RenderOptions } from '@testing-library/react'
import { createThemeFactory, type ThemeColors } from '../../../src/ui/theme'
import { ThemeProvider } from '../../../src/ui/theme-context'

const PALETTE = { 50: '#F0F7F4', 100: '#D9EDE3', 200: '#B3DBC8', 300: '#80C2A3', 400: '#4DA67D', 500: '#2E8A60', 600: '#26694E', 700: '#1F5440', 800: '#183F30' } as const

export const TEST_BRAND = {
  colors: {
    navBg: '#102030',
    navBgHover: '#172D4D',
    navFg: '#1E3A6A',
    navFgActive: '#254787',
    navActiveBg: '#2C54A4',
    inkSurface: '#3361C1',
    inkSurfaceHover: '#3A6EDE',
    tableHeaderBg: '#417BFB',
    lineStrong: '#488818',
    lineSection: '#4F9535',
    accent100: '#56A252',
    link: '#5DAF6F',
    accent300: '#64BC8C',
    accent600: '#6BC9A9',
    accent50: '#72D6C6',
    neutralSunken: '#79E3E3',
    canvas: '#80F000',
    surfaceSunken: '#87FD1D',
    surface: '#8E0A3A',
    line: '#951757',
    lineControl: '#9C2474',
    ink: '#A33191',
    inkMuted: '#AA3EAE',
    inkFaint: '#B14BCB',
    font: '#B858E8',
  } satisfies ThemeColors,
  accent: PALETTE,
  secondary: PALETTE,
  avatar: ['#111111', '#222222', '#333333', '#444444', '#555555'] as const,
}

export const createTestTheme = createThemeFactory(TEST_BRAND)
export const testTheme = createTestTheme()

/** 包上測試主題；呼叫端另給的 wrapper 疊在裡面（不會把 ThemeProvider 蓋掉） */
export function renderWithTheme(ui: Parameters<typeof render>[0], options?: RenderOptions) {
  const Inner = options?.wrapper as ((p: { children: ReactNode }) => ReactNode) | undefined
  const Wrapper = ({ children }: { children: ReactNode }) => <ThemeProvider theme={testTheme}>{Inner ? <Inner>{children}</Inner> : children}</ThemeProvider>
  return render(ui, { ...options, wrapper: Wrapper })
}
