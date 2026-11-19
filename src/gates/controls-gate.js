// 控制項高度閘門的判斷核心（2026-11-19 自 inknock scripts/check-controls.mjs 搬入，inknock ADR 0002 E 批）——純函式，不讀檔。
//
// scan     控制項高度不可寫死數字：數值 24–56 的 `height:` 數字字面值，不論是否在階梯上（一律引用 T.controlH）。
//          例外：非控制項（頭像、圖示底框、色塊）在違規行的上一行／同一行／下兩行寫 `audit-ok: controlHeight — 理由`。
//          邊界（刻意不擋，歸 code review）：高度來自變數、計算式、`minHeight`、樣式展開。閘門只擋「不小心」。
// scanHit  自繪的 <button>／<a>／<Link> 若高度或寬度引用 T.controlH，className 必須含 `hit-area`（可點範圍靠 ::after 補到 44），
//          否則手機上可點範圍只剩外觀大小。style 是同檔變數（含展開 `...btnBase`）時展開一層判斷。
//          例外寫 `audit-ok: hitArea — 理由`（同上下行規則）。邊界：style 來自別的檔案、div 加 onClick、<input>／<select>。
// 負例清單：tests/gates/controls-gate.test.js。
import ts from 'typescript'

const MIN = 24, MAX = 56

export function scan(file, text) {
  const sf = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true, file.endsWith('x') ? ts.ScriptKind.TSX : ts.ScriptKind.TS)
  const lines = text.split('\n')
  const hits = []
  const visit = node => {
    if (ts.isPropertyAssignment(node) && node.name.getText(sf) === 'height' && ts.isNumericLiteral(node.initializer)) {
      const v = Number(node.initializer.text)
      if (v >= MIN && v <= MAX) {
        const line = sf.getLineAndCharacterOfPosition(node.getStart(sf)).line // 0-based
        const probe = [lines[line - 1], lines[line], lines[line + 1], lines[line + 2]]
        if (!probe.some(l => (l ?? '').includes('audit-ok: controlHeight'))) hits.push({ file, line: line + 1, v })
      }
    }
    ts.forEachChild(node, visit)
  }
  visit(sf)
  return hits
}

const HIT_TAGS = new Set(['button', 'a', 'Link'])
export function scanHit(file, text) {
  const sf = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true, file.endsWith('x') ? ts.ScriptKind.TSX : ts.ScriptKind.TS)
  const lines = text.split('\n')
  // 依作用域找宣告：從引用處往外層走，每層 block 只看直接宣告在它底下的 const／let（同名變數在別的元件不會被拿錯）。
  // 途中遇到同名的參數、解構、for…of／in 綁定＝被遮蔽，值來自別處、無從得知 → 停止（不拿外層宣告來判斷）
  const binds = (name, text) => ts.isIdentifier(name)
    ? name.text === text
    : name.elements.some(el => !ts.isOmittedExpression(el) && binds(el.name, text))
  const findDecl = (id) => {
    for (let n = id.parent; n; n = n.parent) {
      if (ts.isFunctionLike(n) && n.parameters?.some(p => binds(p.name, id.text))) return undefined
      if ((ts.isForOfStatement(n) || ts.isForInStatement(n)) && ts.isVariableDeclarationList(n.initializer) &&
          n.initializer.declarations.some(d => binds(d.name, id.text))) return undefined
      if (ts.isBlock(n) || ts.isSourceFile(n) || ts.isModuleBlock(n) || ts.isCaseClause(n) || ts.isDefaultClause(n)) {
        for (const st of n.statements) {
          if (!ts.isVariableStatement(st)) continue
          for (const d of st.declarationList.declarations) {
            if (!binds(d.name, id.text)) continue
            return ts.isIdentifier(d.name) ? d.initializer : undefined   // 解構取出的值無從得知
          }
        }
      }
    }
    return undefined
  }
  // 走語法樹而不是比對文字：style 物件裡的註解（「controlH.lg(44)」）不算；
  // 被引用的同檔變數（style={btnBase}、{...btnBase}）展開一層，屬性名（{ line: … } 的 line）不算引用
  const usesControlH = (node, depth) => {
    let found = false
    const v = n => {
      if (found) return
      if (ts.isPropertyAccessExpression(n) && n.name.text === 'controlH') { found = true; return }
      if (ts.isElementAccessExpression(n) && ts.isPropertyAccessExpression(n.expression) && n.expression.name.text === 'controlH') { found = true; return }
      if (depth > 0 && ts.isIdentifier(n) && !(ts.isPropertyAccessExpression(n.parent) && n.parent.name === n) &&
          !(ts.isPropertyAssignment(n.parent) && n.parent.name === n)) {
        const init = findDecl(n)
        if (init && usesControlH(init, depth - 1)) { found = true; return }
      }
      ts.forEachChild(n, v)
    }
    v(node)
    return found
  }
  const hits = []
  const visit = node => {
    if ((ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) && HIT_TAGS.has(node.tagName.getText(sf))) {
      const attr = name => node.attributes.properties.find(p => ts.isJsxAttribute(p) && p.name.getText(sf) === name)
      const style = attr('style')
      if (style?.initializer && usesControlH(style.initializer, 1)) {
        const cls = attr('className')?.initializer?.getText(sf) ?? ''
        const line = sf.getLineAndCharacterOfPosition(node.getStart(sf)).line
        const probe = [lines[line - 1], lines[line], lines[line + 1], lines[line + 2]]
        if (!/\bhit-area\b/.test(cls) && !probe.some(l => (l ?? '').includes('audit-ok: hitArea'))) hits.push({ file, line: line + 1, tag: node.tagName.getText(sf) })
      }
    }
    ts.forEachChild(node, visit)
  }
  visit(sf)
  return hits
}
