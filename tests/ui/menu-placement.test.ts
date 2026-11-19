// 浮層定位（2026-11-16 由 use-dropdown-menu.ts 抽出，與搜尋選單共用）。
// 下拉選單傳整個視窗，結果與抽出前逐項相同；搜尋選單傳 visualViewport（iPad 鍵盤叫出後可見範圍變矮、且可能有 offsetTop）。
import { describe, expect, it } from 'vitest'
import { MENU_EDGE, MENU_GAP, placeMenu } from '../../src/ui/menu-placement'

const anchor = (top: number, left = 100, width = 200, h = 32) => ({ top, bottom: top + h, left, right: left + width, width })
const win = { top: 0, bottom: 800, width: 1200 }

describe('placeMenu', () => {
  it('下方放得下 → 往下開，寬度至少同錨點', () => {
    const p = placeMenu({ anchor: anchor(100), height: 200, viewport: win, align: 'start' })
    expect(p).toEqual({ top: 132 + MENU_GAP, x: 100, width: 200, up: false, maxH: 800 - (132 + MENU_GAP) - MENU_EDGE })
  })

  it('下方放不下、上方放得下 → 往上開', () => {
    const p = placeMenu({ anchor: anchor(600), height: 300, viewport: win, align: 'start' })
    expect(p.up).toBe(true)
    expect(p.top).toBe(600 - MENU_GAP - 300)
  })

  it('上下都放不下 → 貼齊可見範圍上緣，由浮層自己捲', () => {
    const p = placeMenu({ anchor: anchor(400), height: 2000, viewport: win, align: 'start' })
    expect(p.up).toBe(false)
    expect(p.top).toBe(MENU_EDGE)
    expect(p.maxH).toBe(800 - 2 * MENU_EDGE)
  })

  it('靠右對齊以右緣距離表示；靠左對齊不超出右緣（含浮層實際寬度）', () => {
    expect(placeMenu({ anchor: anchor(100, 900, 100), height: 100, viewport: win, align: 'end' }).x).toBe(1200 - 1000)
    expect(placeMenu({ anchor: anchor(100, 1100, 50), height: 100, viewport: win, align: 'start', menuWidth: 300 }).x).toBe(1200 - 300 - MENU_EDGE)
  })

  it('keepAnchorVisible（搜尋選單）：上下都放不下時挑空間大的一邊、縮高，不蓋住輸入框', () => {
    const vv = { top: 0, bottom: 360, width: 1200 }
    // 輸入框在 144～176：下方 360-176-14=170、上方 144-14=130 → 往下、高度 170
    const down = placeMenu({ anchor: anchor(144), height: 344, viewport: vv, align: 'start', keepAnchorVisible: true })
    expect(down).toMatchObject({ top: 176 + MENU_GAP, up: false, maxH: 360 - 176 - MENU_GAP - MENU_EDGE })
    // 輸入框在 250～282：上方空間大 → 往上，底緣貼齊輸入框上方
    const up = placeMenu({ anchor: anchor(250), height: 344, viewport: vv, align: 'start', keepAnchorVisible: true })
    expect(up.up).toBe(true)
    expect(up.top + up.maxH).toBe(250 - MENU_GAP)
    expect(up.top).toBe(MENU_EDGE)
    // 對照：下拉選單（不設）同樣情形貼齊上緣，會蓋住錨點
    const menu = placeMenu({ anchor: anchor(144), height: 344, viewport: vv, align: 'start' })
    expect(menu.top).toBe(MENU_EDGE)
    expect(menu.top + Math.min(344, menu.maxH)).toBeGreaterThan(144)
  })

  it('可見範圍被鍵盤壓矮（visualViewport）：照可見範圍判斷上下，而不是整個視窗', () => {
    // 視窗 800 高，鍵盤叫出後只剩上方 400、頁面又捲了 100：可見範圍是 100～500
    const vv = { top: 100, bottom: 500, width: 1200 }
    const p = placeMenu({ anchor: anchor(400), height: 200, viewport: vv, align: 'start' })
    expect(p.up).toBe(true) // 用整個視窗算會往下開、開在鍵盤後面
    expect(p.top).toBe(400 - MENU_GAP - 200)
    const q = placeMenu({ anchor: anchor(300), height: 600, viewport: vv, align: 'start' })
    expect(q.top).toBe(100 + MENU_EDGE) // 上下都不夠：貼齊「可見範圍」上緣，不是視窗上緣 0
    expect(q.maxH).toBe(500 - (100 + MENU_EDGE) - MENU_EDGE)
  })
})
