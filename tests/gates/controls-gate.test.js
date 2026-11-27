// @vitest-environment node
// controls-gate 的正反對照（閘門要先證明會亮）。2026-11-19 自 inknock tests/check-controls.test.ts 搬入（ADR 0002 E 批），案例不變。
import { describe, it, expect } from 'vitest'
import { scan, scanHit } from '../../src/gates/controls-gate.js'

const hits = src => scan('x.tsx', src)

describe('check:controls', () => {
  it('寫死高度會亮——即使是合法階梯值 44', () => {
    expect(hits(`const s = { width: 44, height: 44 }`)).toHaveLength(1)
    expect(hits(`<button style={{ height: 40 }} />`)).toHaveLength(1)
  })

  it('「⋯」事件的形狀：修前（寫死 44）亮、修後（引用代幣）不亮', () => {
    // 摘自 e8bd3f9 前後的 overflow-menu 觸發鈕（CI 是淺 clone，不能用 git show 取舊版）
    const before = `<button style={{\n  width: 44, height: 44,                       // iOS HIG 觸控目標\n}} />`
    const after = `<button style={{\n  width: triggerH, height: triggerH,\n}} />`
    expect(hits(before)).toHaveLength(1)
    expect(hits(after)).toHaveLength(0)
  })

  it('範圍外的數值、註解、引用代幣都不算', () => {
    expect(hits(`const s = { height: 1 }`)).toHaveLength(0)
    expect(hits(`const s = { height: 120 }`)).toHaveLength(0)
    expect(hits(`// height: 40\nconst s = { height: T.controlH.md }`)).toHaveLength(0)
    expect(hits(`/* { height: 40 } */`)).toHaveLength(0)
  })

  it('audit-ok 例外：上一行、同一行、下兩行都認；更遠不認；要寫對規則名', () => {
    expect(hits(`// audit-ok: controlHeight — 頭像\nconst s = { height: 32 }`)).toHaveLength(0)
    expect(hits(`const s = { height: 32 } // audit-ok: controlHeight — 頭像`)).toHaveLength(0)
    expect(hits(`const s = {\n height: 32,\n\n // audit-ok: controlHeight — 頭像\n}`)).toHaveLength(0)
    expect(hits(`// audit-ok: controlHeight\n\n\nconst s = { height: 32 }`)).toHaveLength(1)
    expect(hits(`// audit-ok: bareControl — 別的規則\nconst s = { height: 32 }`)).toHaveLength(1)
  })

  it('邊界（刻意不擋，歸 code review）：變數與計算式', () => {
    expect(hits(`const h = 40; const s = { height: h }`)).toHaveLength(0)
    expect(hits(`const s = { height: 20 + 20 }`)).toHaveLength(0)
  })
})

// 第二條規則：自繪按鈕高度引用 T.controlH 時必須帶 hit-area（2026-11-13 方案 B，可點範圍補到 44）
const noHit = src => scanHit('x.tsx', src)

describe('check:controls hitArea', () => {
  it('自繪 button／a／Link 引用 controlH 卻沒有 hit-area 會亮；補上就不亮', () => {
    expect(noHit(`<button style={{ height: T.controlH.md }} />`)).toHaveLength(1)
    expect(noHit(`<a href="#" style={{ width: T.controlH.sm, height: T.controlH.sm }}>x</a>`)).toHaveLength(1)
    expect(noHit(`<Link to="/" style={{ height: T.controlH['lg'] }}>x</Link>`)).toHaveLength(1)
    expect(noHit(`<button className="focus-ring hit-area" style={{ height: T.controlH.md }} />`)).toHaveLength(0)
    expect(noHit(`<button className="hit-area" style={{ height: T.controlH.md }} />`)).toHaveLength(0)
  })

  it('extraTags：專案的自繪按鈕元件一併檢查；未列入的不檢查；不合法的名稱直接報錯', () => {
    const src = `<BlockButton style={{ height: T.controlH.md }}>x</BlockButton>`
    expect(noHit(src)).toHaveLength(0)
    expect(scanHit('x.tsx', src, { extraTags: ['BlockButton'] })).toEqual([{ file: 'x.tsx', line: 1, tag: 'BlockButton' }])
    expect(scanHit('x.tsx', `<BlockButton className="hit-area" style={{ height: T.controlH.md }} />`, { extraTags: ['BlockButton'] })).toHaveLength(0)
    expect(scanHit('x.tsx', `<button style={{ height: T.controlH.md }} />`, { extraTags: ['BlockButton'] })).toHaveLength(1) // 內建標籤照舊
    expect(() => scanHit('x.tsx', src, { extraTags: ['<BlockButton'] })).toThrow(TypeError)
    expect(() => scanHit('x.tsx', src, { extraTags: 'BlockButton' })).toThrow(TypeError)
    // 永遠比對不到的名稱（結尾點、連續點、空白）不可靜默通過
    for (const bad of ['BlockButton.', 'ui..Btn', 'Block Button', '']) expect(() => scanHit('x.tsx', src, { extraTags: [bad] })).toThrow(TypeError)
    expect(scanHit('x.tsx', `<ui.Btn style={{ height: T.controlH.md }} />`, { extraTags: ['ui.Btn', '_X', '$Y'] })).toHaveLength(1)
    expect(scanHit('x.tsx', src, null)).toHaveLength(0)
    expect(() => scanHit('x.tsx', src, { extraTags: new Array(2) })).toThrow(TypeError)   // 稀疏陣列
    for (const v of [null, undefined]) expect(() => scanHit('x.tsx', src, { extraTags: v })).toThrow(TypeError)
    expect(() => scanHit('x.tsx', src, ['BlockButton'])).toThrow(TypeError)            // 整個傳陣列
    expect(() => scanHit('x.tsx', src, { extraTag: ['BlockButton'] })).toThrow(TypeError) // 鍵名打錯
    expect(scanHit('x.tsx', `<\\u0042lockButton style={{ height: T.controlH.md }} />`, { extraTags: ['BlockButton'] })).toHaveLength(1)   // 跳脫寫法同樣比對到
    // eslint-disable-next-line no-sparse-arrays -- 刻意的稀疏陣列負例
    expect(() => scanHit('x.tsx', src, { extraTags: [, 'BlockButton'] })).toThrow(TypeError)
    const h = (tag) => `<${tag} style={{ height: T.controlH.md }} />`
    for (const t of ['_X', '$Y']) expect(scanHit('x.tsx', h(t), { extraTags: ['_X', '$Y'] })).toHaveLength(1)
    for (const t of ['ui . Btn', 'ui /* c */.Btn']) expect(scanHit('x.tsx', h(t), { extraTags: ['ui.Btn'] })).toEqual([{ file: 'x.tsx', line: 1, tag: 'ui.Btn' }])
    // 邊界（負例清單，刻意不擋）：別名、重新指派、成員寫法不同
    const opts = { extraTags: ['BlockButton'] }
    expect(scanHit('x.tsx', `import { BlockButton as Cell } from 'x'\n<Cell style={{ height: T.controlH.md }} />`, opts)).toHaveLength(0)
    expect(scanHit('x.tsx', `const B = BlockButton\n<B style={{ height: T.controlH.md }} />`, opts)).toHaveLength(0)
    expect(scanHit('x.tsx', `<ui.BlockButton style={{ height: T.controlH.md }} />`, opts)).toHaveLength(0)
  })

  it('hitProp：extraTags 元件寫 hit／hit={true} 放行；false、條件式、變數、原生標籤不算', () => {
    const o = { extraTags: ['BlockButton'], hitProp: 'hit' }
    const b = attrs => `<BlockButton ${attrs} style={{ height: T.controlH.md }} />`
    expect(scanHit('x.tsx', b('hit'), o)).toHaveLength(0)
    expect(scanHit('x.tsx', b('hit={true}'), o)).toHaveLength(0)
    for (const a of ['hit={false}', 'hit={on}', 'hit={a ? true : false}', 'hit="true"', '']) expect(scanHit('x.tsx', b(a), o)).toHaveLength(1)
    expect(scanHit('x.tsx', b('hit'), { extraTags: ['BlockButton'] })).toHaveLength(1)        // 沒設 hitProp 不認
    expect(scanHit('x.tsx', `<button hit style={{ height: T.controlH.md }} />`, o)).toHaveLength(1) // 原生標籤不認
    for (const bad of [1, '', 'a-b', null]) {
      if (bad === null) expect(scanHit('x.tsx', b(''), { hitProp: null, extraTags: ['BlockButton'] })).toHaveLength(1)
      else expect(() => scanHit('x.tsx', b(''), { ...o, hitProp: bad })).toThrow(TypeError)
    }
  })

  it('同檔變數展開一層：style={btnBase}、{...btnBase}、三元式', () => {
    const decl = `const btnBase = { height: T.controlH.md };\n`
    expect(noHit(decl + `<button style={btnBase} />`)).toHaveLength(1)
    expect(noHit(decl + `<button style={{ ...btnBase, color: 'red' }} />`)).toHaveLength(1)
    expect(noHit(decl + `<button style={off ? other : btnBase} />`)).toHaveLength(1)
    expect(noHit(decl + `<button className="hit-area" style={btnBase} />`)).toHaveLength(0)
  })

  // code review 2026-11-13：同名變數在不同元件各宣告一次時，要找最近的那個，不能拿檔內最後一個
  it('同名變數依作用域找最近的宣告', () => {
    const two = firstUses => `function A() {\n  const style = { height: ${firstUses ? 'T.controlH.md' : '20'} };\n  return <button style={style} />\n}\nfunction B() {\n  const style = { height: ${firstUses ? '20' : 'T.controlH.md'} };\n  return <div style={style} />\n}`
    expect(noHit(two(true))).toHaveLength(1)   // A 用了 controlH、沒 hit-area → 要亮（舊寫法拿到 B 的宣告而漏掉）
    expect(noHit(two(false))).toHaveLength(0)  // A 沒用 → 不亮（舊寫法拿到 B 的宣告而誤報）
  })

  // 第二輪 review：參數、解構同名時是另一個變數，不可拿外層宣告來判斷
  it('參數或解構遮蔽外層同名變數：不拿外層宣告', () => {
    const outer = `const style = { height: T.controlH.md };\n`
    expect(noHit(outer + `function Row({ style }) {\n  return <button style={style} />\n}`)).toHaveLength(0)
    expect(noHit(outer + `function Row(style) {\n  return <button style={style} />\n}`)).toHaveLength(0)
    expect(noHit(outer + `function Row(p) {\n  const { style } = p;\n  return <button style={style} />\n}`)).toHaveLength(0)
    expect(noHit(outer + `for (const style of list) { <button style={style} /> }`)).toHaveLength(0)
    // 沒有遮蔽時照常抓外層
    expect(noHit(outer + `function Row() {\n  return <button style={style} />\n}`)).toHaveLength(1)
  })

  it('不算引用：style 裡的註解、屬性名、版面列高 rowH', () => {
    // 期間選單項的形狀：註解寫「controlH.lg(44)」，實際用 rowH
    expect(noHit(`<button style={{\n  // 選單項 → controlH.lg(44)\n  height: T.rowH.touch,\n}} />`)).toHaveLength(0)
    // 門檻列 ✕ 的形狀：eslint-disable-next-line 的 line 不是變數；屬性名 line 也不是
    expect(noHit(`const line = { height: T.controlH.md };\n<button style={{\n  // eslint-disable-next-line x\n  width: 26, line: 1 }} />`)).toHaveLength(0)
  })

  it('範圍外：Button／IconButton 自帶、input／select 做不到、div 不管', () => {
    expect(noHit(`<Button style={{ width: T.controlH.md }}>x</Button>`)).toHaveLength(0)
    expect(noHit(`<input style={{ height: T.controlH.sm }} />`)).toHaveLength(0)
    expect(noHit(`<select style={{ height: T.controlH.md }} />`)).toHaveLength(0)
    expect(noHit(`<div style={{ height: T.controlH.md }} />`)).toHaveLength(0)
  })

  it('audit-ok: hitArea 例外要寫對規則名', () => {
    expect(noHit(`// audit-ok: hitArea — 理由\n<button style={{ height: T.controlH.md }} />`)).toHaveLength(0)
    expect(noHit(`// audit-ok: controlHeight — 別的規則\n<button style={{ height: T.controlH.md }} />`)).toHaveLength(1)
  })
})
