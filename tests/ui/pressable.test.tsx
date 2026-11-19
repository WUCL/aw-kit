// 2026-11-19 自 inknock tests/pressable.test.tsx 搬入（inknock ADR 0002 D1 批）
// @vitest-environment jsdom
// 「整塊可以點」的區塊（2026-11-17 第 20 批）：原本裸 <div onClick>，鍵盤到不了、報讀不知道能按。
import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { createPortal } from 'react-dom'
import { Pressable } from '../../src/ui/pressable'


describe('Pressable', () => {
  it('是可聚焦的按鈕；點擊、Enter、空白鍵（放開時）都觸發', () => {
    const onPress = vi.fn()
    render(<Pressable onPress={onPress}>訂單 A-1</Pressable>)
    const b = screen.getByRole('button', { name: '訂單 A-1' })
    expect(b.tabIndex).toBe(0)
    expect(b.className).toContain('focus-ring')
    fireEvent.click(b)
    fireEvent.keyDown(b, { key: 'Enter' })
    fireEvent.keyDown(b, { key: ' ' })
    expect(onPress).toHaveBeenCalledTimes(2)   // 空白鍵按下時不觸發
    fireEvent.keyUp(b, { key: ' ' })
    expect(onPress).toHaveBeenCalledTimes(3)
  })
  it('注音組字中的 Enter 不觸發；按住的自動重複不觸發', () => {
    const onPress = vi.fn()
    render(<Pressable onPress={onPress}>x</Pressable>)
    const b = screen.getByRole('button', { name: 'x' })
    fireEvent.keyDown(b, { key: 'Enter', keyCode: 229 })
    fireEvent.keyDown(b, { key: 'Enter', repeat: true })
    expect(onPress).not.toHaveBeenCalled()
  })
  it('disabled：不觸發、aria-disabled，仍可聚焦', () => {
    const onPress = vi.fn()
    render(<Pressable onPress={onPress} disabled>x</Pressable>)
    const b = screen.getByRole('button', { name: 'x' })
    fireEvent.click(b); fireEvent.keyDown(b, { key: 'Enter' })
    expect(onPress).not.toHaveBeenCalled()
    expect(b.getAttribute('aria-disabled')).toBe('true')
    expect(b.tabIndex).toBe(0)
  })
  it('一律是 role=button（切換開關改用 label＋共用 Switch，不再有 role=switch 選項，第 28 批）', () => {
    render(<Pressable onPress={() => {}}>x</Pressable>)
    expect(screen.getByRole('button', { name: 'x' })).toBeTruthy()
    expect(screen.queryByRole('switch')).toBeNull()
  })
  it('內層的輸入框／按鈕：按鍵與點擊留給它們自己，不觸發整列（review）', () => {
    const onPress = vi.fn(); const inner = vi.fn()
    render(<Pressable onPress={onPress}>列 <input aria-label="備註" /><button type="button" onClick={inner}>內層</button></Pressable>)
    const input = screen.getByRole('textbox', { name: '備註' })
    fireEvent.keyDown(input, { key: ' ' }); fireEvent.keyUp(input, { key: ' ' })
    fireEvent.keyDown(input, { key: 'Enter' })
    fireEvent.click(screen.getByRole('button', { name: '內層' }))
    expect(onPress).not.toHaveBeenCalled()
    expect(inner).toHaveBeenCalledTimes(1)
  })
  it('ref 轉傳到外層元素；外圈畫在框內（清單容器 overflow:hidden 不會裁掉）', () => {
    const ref = React.createRef<HTMLDivElement>()
    render(<Pressable ref={ref} onPress={() => {}}>x</Pressable>)
    expect(ref.current).toBe(screen.getByRole('button', { name: 'x' }))
    expect(ref.current!.className).toContain('focus-ring-inset')
  })
  it('portal 出去的內容（浮框、確認框）裡的點擊不觸發整列；label 包住的勾選框也留給它自己（補審）', () => {
    const onPress = vi.fn()
    render(<Pressable onPress={onPress}>列{createPortal(<div>浮框說明</div>, document.body)}<label><input type="checkbox" />選取</label></Pressable>)
    fireEvent.click(screen.getByText('浮框說明'))
    fireEvent.click(screen.getByText('選取'))
    expect(onPress).not.toHaveBeenCalled()
  })
})
