// 2026-11-19 自 inknock tests/prompt-dialog-ime.test.tsx 搬入（inknock ADR 0002 D3 批）；主題改用測試夾具 helpers/test-theme。
// @vitest-environment jsdom
//
// 駁回原因跳窗：中文輸入法選字的 Enter 不可以送出（2026-10-04 使用者回報）。
import { useEffect } from 'react'
import { ThemeProvider } from '../../src/ui/theme-context'
import { testTheme } from './helpers/test-theme'
import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { installMatchMedia } from './helpers/match-media'
installMatchMedia(false)
import { PromptDialogProvider, usePrompt } from '../../src/ui/prompt-dialog'


function setup() {
  const result: { value: string | null | undefined } = { value: undefined }
  function Opener() {
    const prompt = usePrompt()
    useEffect(() => { void prompt({ title: '駁回原因', placeholder: '原因' }).then(v => { result.value = v }) }, [prompt])
    return null
  }
  render(<ThemeProvider theme={testTheme}><PromptDialogProvider><Opener /></PromptDialogProvider></ThemeProvider>)
  const input = screen.getByPlaceholderText('原因')
  fireEvent.change(input, { target: { value: '缺' } })
  return { input, result }
}

describe('PromptDialog：輸入法 Enter', () => {
  it('組字中的 Enter（isComposing）→ 不送出', async () => {
    const { input, result } = setup()
    fireEvent.keyDown(input, { key: 'Enter', keyCode: 13, isComposing: true })
    await act(async () => {})
    expect(result.value).toBeUndefined()
  })
  it('Safari 補發的 keyCode 229 → 不送出', async () => {
    const { input, result } = setup()
    fireEvent.keyDown(input, { key: 'Enter', keyCode: 229 })
    await act(async () => {})
    expect(result.value).toBeUndefined()
  })
  it('選完字再按一次 Enter → 送出', async () => {
    const { input, result } = setup()
    fireEvent.keyDown(input, { key: 'Enter', keyCode: 13 })
    await act(async () => {})
    expect(result.value).toBe('缺')
  })
})

// 2026-11-14：原本是裸 <input>＋useInputStyle（outline: none、沒有聚焦外圈），改走共用 Input
describe('PromptDialog：欄位外觀走共用 Input', () => {
  it('有 data-slot="input"（共用 Input，聚焦外圈由 field-shadcn 測試負責）', () => {
    const { input } = setup()
    expect(input.getAttribute('data-slot')).toBe('input')
  })
})
