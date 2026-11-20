// @vitest-environment jsdom
// SwitchRow（2026-11-20 inknock TODO ⑪）：名稱固定＝標題、說明另外念、整列點一次只切換一次、停用不切換、警示色只在開啟時。
import { describe, expect, it, vi, beforeAll } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { useState } from 'react'
import { ThemeProvider } from '../../src/ui/theme-context'
import { testTheme } from './helpers/test-theme'
import { installMatchMedia } from './helpers/match-media'
import { SwitchRow } from '../../src/ui/switch-row'
import { Switch } from '../../src/ui/switch'

beforeAll(() => installMatchMedia(false))

function Row({ init, onToggle, ...rest }: { init?: boolean; onToggle?: () => void } & Partial<Parameters<typeof SwitchRow>[0]>) {
  const [on, setOn] = useState(init ?? false)
  return (
    <ThemeProvider theme={testTheme}>
      <SwitchRow label="現金" checked={on} onChange={() => { setOn(v => !v); onToggle?.() }} {...rest} />
    </ThemeProvider>
  )
}

describe('SwitchRow', () => {
  it('名稱＝標題（不含說明），說明另外念', () => {
    render(<Row description="現場收取現金" />)
    const sw = screen.getByRole('switch', { name: '現金', description: '現場收取現金' })
    expect(sw).toBeTruthy()
    // 只靠 label 原生名稱時會變成「現金現場收取現金」——這裡證明沒有
    expect(screen.queryByRole('switch', { name: '現金現場收取現金' })).toBeNull()
  })

  it('點標題、點說明、點開關本身：各只切換一次', () => {
    const onToggle = vi.fn()
    render(<Row description="現場收取現金" onToggle={onToggle} />)
    const sw = screen.getByRole('switch')
    fireEvent.click(screen.getByText('現金'))
    expect(onToggle).toHaveBeenCalledTimes(1)
    expect(sw.getAttribute('aria-checked')).toBe('true')
    fireEvent.click(screen.getByText('現場收取現金'))
    expect(onToggle).toHaveBeenCalledTimes(2)
    fireEvent.click(sw)
    expect(onToggle).toHaveBeenCalledTimes(3)
    expect(sw.getAttribute('aria-checked')).toBe('true')
  })

  it('停用：點整列不切換', () => {
    const onToggle = vi.fn()
    render(<Row disabled onToggle={onToggle} />)
    fireEvent.click(screen.getByText('現金'))
    fireEvent.click(screen.getByRole('switch'))
    expect(onToggle).not.toHaveBeenCalled()
  })

  it('狀態字不進名稱：開關前後名稱都是標題', () => {
    function NoShow() {
      const [no, setNo] = useState(false)
      return (
        <ThemeProvider theme={testTheme}>
          <SwitchRow framed tone="warning" label="未到場" stateText={no ? '客戶未出現' : '客戶有出現'} checked={no} onChange={() => setNo(v => !v)} />
        </ThemeProvider>
      )
    }
    render(<NoShow />)
    expect(screen.getByRole('switch', { name: '未到場' })).toBeTruthy()
    fireEvent.click(screen.getByText('未到場'))
    expect(screen.getByRole('switch', { name: '未到場' }).getAttribute('aria-checked')).toBe('true')
    expect(screen.getByText('客戶未出現').getAttribute('aria-hidden')).toBe('true')
  })

  it('警示色只在 tone=warning 且開啟時；預設 tone 開啟時外框不變', () => {
    const frame = (el: HTMLElement) => el.closest('label') as HTMLLabelElement
    const { unmount } = render(<Row framed tone="warning" />)
    const off = frame(screen.getByRole('switch')).style.borderColor
    fireEvent.click(screen.getByText('現金'))
    const on = frame(screen.getByRole('switch')).style.borderColor
    expect(on).not.toBe(off)
    unmount()
    render(<Row framed />)
    const d0 = frame(screen.getByRole('switch')).style.borderColor
    fireEvent.click(screen.getByText('現金'))
    expect(frame(screen.getByRole('switch')).style.borderColor).toBe(d0)
  })

  it('不加 framed 時沒有外框（清單裡的分隔線由外層畫）', () => {
    render(<Row />)
    const label = screen.getByRole('switch').closest('label') as HTMLLabelElement
    expect(label.style.border).toBe('')
    expect(label.style.background).toBe('')
  })
})

describe('Switch 的名稱 props', () => {
  it('aria-label 給固定名稱（例：營業時間「週一營業」，旁邊的字隨狀態變）', () => {
    render(<Switch aria-label="週一營業" checked onChange={() => {}} />)
    expect(screen.getByRole('switch', { name: '週一營業' })).toBeTruthy()
  })
})

// 型別層：沒有名稱的 Switch 編譯不過（tsc -p tests/ui/tsconfig.json；拿掉 SwitchName 聯集時這些 @ts-expect-error 會變成「沒有錯誤」而紅）。
// 別名 import、展開屬性、`aria-label={undefined}` 都繞不過（展開的物件型別一樣要符合聯集）。
export function _typeNegatives(cond: boolean, p: { checked: boolean; onChange: () => void }) {
  return [
    // @ts-expect-error 沒有名稱
    <Switch checked onChange={() => {}} />,
    // @ts-expect-error aria-label 給 undefined
    <Switch aria-label={undefined} checked onChange={() => {}} />,
    // @ts-expect-error 條件式可能是 undefined
    <Switch aria-labelledby={cond ? 'x' : undefined} checked onChange={() => {}} />,
    // @ts-expect-error 只有展開、沒有名稱
    <Switch {...p} />,
    <Switch aria-label="週一營業" checked onChange={() => {}} />,
    <Switch aria-labelledby="t" checked onChange={() => {}} />,
    <Switch id="sw" checked onChange={() => {}} />,
    <Switch {...p} aria-label="ok" />,
  ]
}
