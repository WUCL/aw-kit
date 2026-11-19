// 2026-11-19 自 inknock tests/callout.test.tsx 搬入（inknock ADR 0002 D1 批）
// @vitest-environment jsdom
import React from 'react'
import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, fireEvent, cleanup, screen } from '@testing-library/react'
import { installMatchMedia } from './helpers/match-media'
import { Callout } from '../../src/ui/callout'
import { STATE } from '../../src/ui/theme'

afterEach(cleanup)
const r = (ui: React.ReactElement) => { installMatchMedia(false); return render(ui) }

describe('Callout', () => {
  it('warning：role=alert、使用琥珀底色（amber-bg）；按鈕觸發 onClick', () => {
    const onClick = vi.fn()
    r(<Callout tone="warning" action={{ label: '去補齊', onClick }}>有資料待補</Callout>)
    const box = screen.getByRole('alert')
    expect(box.textContent).toContain('有資料待補')
    // 2026-11-15 改走 class：底色＝amber-bg（共用層狀態色，定義在 src/design-tokens 的 BASE；與 STATE.warning.bg 同值由 tests/design-tokens/design-tokens.test.js 的 BASE↔theme.ts 狀態色比對守）
    expect(box.className).toContain('bg-amber-bg')
    expect(STATE.warning.bg).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: '去補齊' }))
    expect(onClick).toHaveBeenCalledOnce()
  })
  it('info：role=status、中性底（neutral-bg）；沒給 action 就沒有按鈕', () => {
    r(<Callout tone="info">說明</Callout>)
    expect(screen.getByRole('status').className).toContain('bg-neutral-bg')
    expect(screen.queryByRole('button')).toBeNull()
  })
})
