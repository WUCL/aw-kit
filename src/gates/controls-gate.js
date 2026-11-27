// 控制項高度閘門的判斷核心（2026-11-19 自 inknock scripts/check-controls.mjs 搬入，inknock ADR 0002 E 批）——純函式，不讀檔。
//
// scan     控制項高度不可寫死數字：數值 24–56 的 `height:` 數字字面值，不論是否在階梯上（一律引用 T.controlH）。
//          例外：非控制項（頭像、圖示底框、色塊）在違規行的上一行／同一行／下兩行寫 `audit-ok: controlHeight — 理由`。
//          邊界（刻意不擋，歸 code review）：高度來自變數、計算式、`minHeight`、樣式展開。閘門只擋「不小心」。
// scanHit  自繪的 <button>／<a>／<Link> 若高度或寬度引用 T.controlH，className 必須含 `hit-area`（可點範圍靠 ::after 補到 44），
//          否則手機上可點範圍只剩外觀大小。style 是同檔變數（含展開 `...btnBase`）時展開一層判斷。
//          例外寫 `audit-ok: hitArea — 理由`（同上下行規則）。邊界：style 來自別的檔案、div 加 onClick、<input>／<select>。
//          專案自己的「自繪按鈕」共用元件（外觀與可點範圍全由呼叫端 style 決定，如 BlockButton）以 opts.extraTags 加入檢查；
//          只接受 JSX 標籤名（以點分段、每段為 JS 識別字），名稱由識別字鏈組回（忽略空白、註解、解開跳脫）後比對：別名 import（`as Cell`）、
//          重新指派（`const B = BlockButton`）、成員寫法不同（`ui.BlockButton` 對 `BlockButton`）都不檢查——歸 code review。
//          合格條件：className 含 hit-area、audit-ok，或 opts.hitProp = { name, tags } 列出的元件把 name 屬性寫成裸屬性或 `={true}`
//          （元件以該 prop 自行加上 hit-area class）。只看最後一個同名屬性、其後不得有 {...spread}；`={false}`、條件式、變數
//          一律不算（靜態看不出值就當沒有，fail-closed）。hitProp.name 寫成無關屬性（如 disabled）無從察覺，歸 code review。
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

const HIT_TAGS = ['button', 'a', 'Link']
const TAG_NAME = /^[A-Za-z_$][\w$]*(\.[A-Za-z_$][\w$]*)*$/
export function scanHit(file, text, opts = {}) {
  // 鍵名打錯或整個傳陣列會靜默變成「沒有額外標籤」→ 只收 null／undefined 或只含 extraTags／hitProp 鍵的物件
  if (opts != null && (typeof opts !== 'object' || Array.isArray(opts) || Object.keys(opts).some(k => k !== 'extraTags' && k !== 'hitProp'))) {
    throw new TypeError(`scanHit: opts 只接受 { extraTags, hitProp }，收到鍵 ${Object.keys(Object(opts)).join(', ')}`)
  }
  // 鍵在但值是 null／undefined（例：{ extraTags: config.extraTag } 打錯來源鍵）同樣靜默變空 → 有鍵就必須是陣列
  const extra = opts != null && 'extraTags' in opts ? opts.extraTags : []
  // Array.from 把稀疏陣列的洞變成 undefined（some 會跳過洞，new Array(2) 會靜默通過）
  if (!Array.isArray(extra) || Array.from(extra).some(t => typeof t !== 'string' || !TAG_NAME.test(t))) {
    throw new TypeError(`scanHit: extraTags 必須是 JSX 標籤名陣列，收到 ${JSON.stringify(extra)}`)
  }
  // hitProp：{ name, tags }——只有 tags 列出的元件（必須在 extraTags 內、真的實作了該 prop）才認 name 屬性。
  // 鍵在就必須完整合法（null／空 tags／不在 extraTags 的標籤都拋錯，不靜默停用）。原生 button／a／Link 不會實作 prop，
  // 列入 tags 拋錯；name 不可是閘門自己判讀或 React 保留的 className／style／key／ref。
  let hitProp = null
  if (opts != null && 'hitProp' in opts) {
    const h = opts.hitProp
    if (!h || typeof h !== 'object' || Array.isArray(h) || Object.keys(h).some(k => k !== 'name' && k !== 'tags') ||
        typeof h.name !== 'string' || !/^[A-Za-z_$][\w$]*$/.test(h.name) || ['className', 'style', 'key', 'ref'].includes(h.name) ||
        !Array.isArray(h.tags) || h.tags.length === 0 || Array.from(h.tags).some(t => typeof t !== 'string' || !extra.includes(t) || HIT_TAGS.includes(t))) {
      throw new TypeError('scanHit: hitProp 必須是 { name: 屬性名, tags: extraTags 內實作該屬性的元件（至少一個）}')
    }
    hitProp = { name: h.name, tags: new Set(h.tags) }
  }
  const tags = new Set([...HIT_TAGS, ...extra])
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
  // 標籤名由識別字鏈組回（不用 getText：`<ui . Btn>`、中間夾註解時原文對不上設定的 'ui.Btn'）
  const tagOf = n => ts.isPropertyAccessExpression(n) ? `${tagOf(n.expression)}.${n.name.text}` : ts.isIdentifier(n) ? n.text : n.getText(sf)
  const hits = []
  const visit = node => {
    const tag = (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) ? tagOf(node.tagName) : null
    if (tag !== null && tags.has(tag)) {
      const props = node.attributes.properties
      const attr = name => props.find(p => ts.isJsxAttribute(p) && p.name.getText(sf) === name)
      const style = attr('style')
      if (style?.initializer && usesControlH(style.initializer, 1)) {
        const cls = attr('className')?.initializer?.getText(sf) ?? ''
        const line = sf.getLineAndCharacterOfPosition(node.getStart(sf)).line
        const probe = [lines[line - 1], lines[line], lines[line + 1], lines[line + 2]]
        // 執行時生效的是「最後一個」同名屬性，且其後的 {...spread} 可能再覆寫 → 只看最後一個，且它之後不得有 spread；
        // 值必須是裸屬性或 {true}，其他寫法看不出值 → 不算（fail-closed）
        let hitOn = false
        if (hitProp?.tags.has(tag)) {
          let i = props.length - 1
          while (i >= 0 && !(ts.isJsxAttribute(props[i]) && props[i].name.getText(sf) === hitProp.name)) i--
          const hp = props[i]
          hitOn = i >= 0 && !props.slice(i + 1).some(p => ts.isJsxSpreadAttribute(p)) &&
            (!hp.initializer || (ts.isJsxExpression(hp.initializer) && hp.initializer.expression?.kind === ts.SyntaxKind.TrueKeyword))
        }
        if (!hitOn && !/\bhit-area\b/.test(cls) && !probe.some(l => (l ?? '').includes('audit-ok: hitArea'))) hits.push({ file, line: line + 1, tag })
      }
    }
    ts.forEachChild(node, visit)
  }
  visit(sf)
  return hits
}
