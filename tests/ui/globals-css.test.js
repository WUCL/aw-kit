// @vitest-environment node
// src/ui/styles/globals.css：aw-kit/ui 元件用到的全域 class 都要在這裡定義（沒定義不報錯，只是聚焦外圈、可點範圍、骨架掃光靜默失效）。
// 已知限制：GLOBAL_CLASSES 是手列的（無法自動分辨 Tailwind utility 與全域 class）；元件開始用新的全域 class 時要加進來。
import { readFileSync, readdirSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const UI = new URL('../../src/ui/', import.meta.url)
const css = readFileSync(new URL('styles/globals.css', UI), 'utf8')
const code = readdirSync(UI, { recursive: true }).map(String).filter(p => /\.tsx?$/.test(p)).map(p => readFileSync(new URL(p, UI), 'utf8')).join('\n')
const GLOBAL_CLASSES = ['focus-ring', 'focus-ring-inset', 'hit-area', 'hide-scrollbar']

describe('aw-kit/ui/styles/globals.css', () => {
  it.each(GLOBAL_CLASSES)('元件用到的 .%s 有定義', cls => {
    expect(code).toMatch(new RegExp(`(["'\`\\s])${cls}(["'\`\\s])`))
    expect(css).toMatch(new RegExp(`\\.${cls}[\\s:{,]`))
  })
  it('skeleton 用的 @keyframes skeleton-shimmer 有定義', () => {
    expect(code).toContain('skeleton-shimmer')
    expect(css).toMatch(/@keyframes skeleton-shimmer\s*\{/)
  })
  it('確認框按鈕（aw-kit/notify）的可點範圍：::after 規則與它依賴的 position: relative 都在這裡（少了定位，::after 會撐滿整個對話框面板）', () => {
    const plain = css.replace(/\/\*[\s\S]*?\*\//g, '')
    expect(plain).toMatch(/\.hit-area::after,\s*\.fbk-dialog-actions \.fbk-btn::after\s*\{[^}]*position:\s*absolute/)
    // 契約：`.fbk-dialog-actions .fbk-btn` 在某個規則裡有 position: relative（選擇器怎麼合併不拘）
    expect(plain).toMatch(/(^|[,}]\s*)\.fbk-dialog-actions \.fbk-btn\s*(,[^{]*)?\{[^}]*position:\s*relative/m)
  })
  it('focus 外圈退回值用品牌層變數、最後退回 currentColor，不寫死任何品牌色', () => {
    expect(css).toContain('var(--focus-ring, var(--ds-accent-600, currentColor))')
    expect(css.replace(/\/\*[\s\S]*?\*\//g, '')).not.toMatch(/#[0-9A-Fa-f]{3,8}\b/)
  })
})
