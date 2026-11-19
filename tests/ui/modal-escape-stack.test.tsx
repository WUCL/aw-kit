// 2026-11-19 自 inknock tests/modal-escape-stack.test.tsx 搬入（inknock ADR 0002 D3 批）；主題改用測試夾具 helpers/test-theme。
// @vitest-environment jsdom
// Modal 疊層：Esc 只關最上層（P2-2，2026-10-23 審查）；組字中的 Esc 仍不算。
import { useState } from 'react'
import { ThemeProvider } from '../../src/ui/theme-context'
import { testTheme } from './helpers/test-theme'
import { describe, it, expect } from 'vitest'
import { render, fireEvent, screen } from '@testing-library/react'
import { Modal } from '../../src/ui/modal'
import { installMatchMedia } from './helpers/match-media'

installMatchMedia()

function Two() {
  const [a, setA] = useState(true)
  const [b, setB] = useState(true)
  return (
    <ThemeProvider theme={testTheme}>
      <Modal open={a} onClose={() => setA(false)} title="下層">內容A</Modal>
      <Modal open={b} onClose={() => setB(false)} title="上層">內容B</Modal>
    </ThemeProvider>
  )
}

describe('Modal Esc 疊層', () => {
  it('兩層 Modal 按一次 Esc 只關上層；再按才關下層', () => {
    render(<Two />)
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(screen.queryByText('內容B')).toBeNull()
    expect(screen.getByText('內容A')).toBeTruthy()
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(screen.queryByText('內容A')).toBeNull()
  })
  it('注音組字中的 Esc 不關任何一層', () => {
    render(<Two />)
    fireEvent.keyDown(document, { key: 'Escape', isComposing: true })
    fireEvent.keyDown(document, { key: 'Escape', keyCode: 229 })
    expect(screen.getByText('內容A')).toBeTruthy()
    expect(screen.getByText('內容B')).toBeTruthy()
  })
})
