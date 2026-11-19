// class 閘門的判斷核心（2026-11-19 自 inknock scripts/check-ui.mjs 搬入，inknock ADR 0002 E 批）——純函式，不讀檔、不讀設定。
// 名單（共用層的字級、間距別名）由呼叫端傳入：消費端用自己 DESIGN.md＋共用層合成的 tokenNames()，aw-kit 自掃用 tokenNames(BASE)。
//
//   checkToken          頁面規則：外觀 class（顏色、框線、陰影、圓角、字級／字重／行高）、非情境別名的間距（p-4、gap-sm…，0 與 m-auto 例外）、任意值
//   checkSharedUiToken  元件層規則：共用層沒有的 Tailwind 內建字級（theme.css 以 `--text-*: initial` 拿掉了，寫了不報錯、只是靜默不產生）
//   aliasDisplayClash   兩層都擋：與間距別名撞名的 display class（inline-block ↔ 別名 block）
//   checkSource         只看 className 類位置（頁面）；checkAllStrings 看檔案裡每一個字串（元件層：shadcn 的 class 多半在 cva() 裡）
//   sourceDirs          tailwind.css 的 @source 解析（路徑寫錯時 Tailwind 不報錯，只是一個 class 都不產生）
//
// checkSource 的邊界（同全域規則「自建安全閘門」）：className 類位置＝名稱為 className／class／*ClassName／classNames 的
// JSX 屬性、物件屬性（含 ['className'] 計算鍵）、解構預設值、參數預設值、變數宣告；涵蓋其中的字串、樣板字串、cn()／三元式。
// 比較式的運算元（variant === 'text-only'）與索引鍵（MAP['border-x']）不是 class，略過。
// class 字串先存進「別的名字」的變數再傳入，擋不到，歸 code review。負例清單鎖在 tests/gates/class-gate.test.js。
// 已知邊界（inknock 2026-11-13 第三輪補審，依停損登記、不再補）：改名解構 `{ root: className = '…' }`、事後賦值
// `className = '…'`、巢狀解構預設值 `{ classNames: { toast = '…' } }` 擋不到；`switch` 的 case 標籤會誤擋；
// `@source inline(…)` 會被報成看不懂的目錄（目前沒用，用到時會紅、不會靜默）。
import { existsSync } from 'node:fs'
import { dirname, relative, resolve } from 'node:path'
import postcss from 'postcss'
import ts from 'typescript'

const APPEARANCE = /^(bg|text|border|ring|outline|shadow|rounded|fill|stroke|decoration|from|via|to|font|leading|tracking|opacity|placeholder|caret|accent|divide|inset-ring|inset-shadow|drop-shadow)(-|$)/
// text-* 裡屬於版面（對齊、換行）的，不算外觀
const TEXT_LAYOUT = /^text-(left|center|right|justify|start|end|wrap|nowrap|balance|pretty|ellipsis|clip)$/
const BORDER_LAYOUT = /^border-(collapse|separate|spacing.*)$/
// 長的放前面：gap-x／space-x 要先於 gap／space，否則 gap-x-stack 會被切成 gap + x-stack
const SPACING = /^(gap-x|gap-y|space-x|space-y|gap|px|py|pt|pr|pb|pl|ps|pe|p|mx|my|mt|mr|mb|ml|ms|me|m)-(.+)$/
const SPACE_REVERSE = /^space-[xy]-reverse$/
// Tailwind 內建字級名（theme.css 已 initial 掉，只補回 SHADCN_TEXT 的 xs／sm／base）；可帶 /行高
const TW_TEXT_SIZE = /^text-(xs|sm|base|lg|xl|\dxl)(\/.+)?$/
const CLASS_PROP = /^(className|class|classNames)$|ClassNames?$/
const EQUALITY = new Set([ts.SyntaxKind.EqualsEqualsEqualsToken, ts.SyntaxKind.ExclamationEqualsEqualsToken, ts.SyntaxKind.EqualsEqualsToken, ts.SyntaxKind.ExclamationEqualsToken])

const need = (v, name) => { if (!Array.isArray(v)) throw new Error(`aw-kit/gates/class-gate：缺少 ${name} 名單（由 aw-kit/design-tokens 的 tokenNames() 取得）`); return v }
const baseOf = raw => raw.split(':').pop().replace(/^!/, '').replace(/!$/, '').replace(/^-/, '')

// 間距別名與 display class 撞名（inknock 2026-11-15 比較頁實測）：Tailwind v4 的 inline-<n> 是 inline-size，
// 共用層（aw-kit design-tokens BASE）有間距別名 block（24）→ `inline-block` 同時產生 display:inline-block 與 inline-size:24px，元素被撐成 24 寬、不報錯。
// 撞名的 display class 一律擋（頁面與元件層都擋），改用 inline-flex、block，或不寫（flex 子項）。
const DISPLAY_INLINE = ['inline-block', 'inline-flex', 'inline-grid', 'inline-table']
export function aliasDisplayClash(raw, spacingAliases) {
  need(spacingAliases, 'spacing')
  const base = baseOf(raw)
  if (DISPLAY_INLINE.includes(base) && spacingAliases.includes(base.slice('inline-'.length)))
    return `${base} 與間距別名「${base.slice('inline-'.length)}」撞名：Tailwind 會多產生 inline-size（元素被撐寬）；請改用 inline-flex、block，或不寫`
  return null
}

/** componentLayer：違規訊息裡「外觀 class 該寫在哪」的目錄（消費端帶入，如 inknock 的 src/shared/ui） */
export function checkToken(raw, spacingAliases, { componentLayer } = {}) {
  need(spacingAliases, 'spacing')
  if (/[[\]]/.test(raw)) return '任意值（[…]）：請用代幣或共用元件'
  const clash = aliasDisplayClash(raw, spacingAliases)
  if (clash) return clash
  const base = baseOf(raw)
  if (APPEARANCE.test(base) && !TEXT_LAYOUT.test(base) && !BORDER_LAYOUT.test(base))
    return `外觀 class 只准寫在${componentLayer ? ` ${componentLayer}` : '元件層'}：頁面請用元件的 variant`
  if (SPACE_REVERSE.test(base)) return null
  const m = base.match(SPACING)
  if (m) {
    const v = m[2]
    if (v === '0' || (v === 'auto' && /^m/.test(m[1])) || spacingAliases.includes(v)) return null
    return `間距只准用情境別名（${spacingAliases.slice(0, 4).join('、')}…，定義在 aw-kit design-tokens 的 BASE gap／pad，共用層不可在 DESIGN.md 新增）`
  }
  return null
}

// 元件層：擋共用層沒有的內建字級，以及與間距別名撞名的 display class
export function checkSharedUiToken(raw, textSizes, spacingAliases) {
  need(textSizes, 'text')
  const clash = aliasDisplayClash(raw, spacingAliases)
  if (clash) return clash
  const m = baseOf(raw).match(TW_TEXT_SIZE)
  if (m && !textSizes.includes(m[1]))
    return `字級 text-${m[1]} 不存在（theme.css 已移除 Tailwind 內建字級）：請對應到 DESIGN.md 的角色，或加進 aw-kit src/design-tokens/index.js 的 SHADCN_TEXT（共用層，改 aw-kit）`
  return null
}

// 屬性／綁定名稱：識別字、字串鍵、['className']／[`className`] 計算鍵
function nameText(name, sf) {
  if (!name) return null
  if (ts.isComputedPropertyName(name)) {
    const e = name.expression
    return ts.isStringLiteral(e) || ts.isNoSubstitutionTemplateLiteral(e) ? e.text : null
  }
  if (ts.isIdentifier(name) || ts.isStringLiteral(name)) return name.text
  if (ts.isObjectBindingPattern(name) || ts.isArrayBindingPattern(name)) return null
  return name.getText(sf)
}

const isStringPart = n => ts.isStringLiteral(n) || ts.isNoSubstitutionTemplateLiteral(n) || ts.isTemplateHead(n) || ts.isTemplateMiddle(n) || ts.isTemplateTail(n)

function tokensOf(node, sf, check, found) {
  const line = sf.getLineAndCharacterOfPosition(node.getStart(sf)).line + 1
  for (const token of node.text.split(/\s+/).filter(Boolean)) {
    const reason = check(token)
    if (reason) found.push({ line, token, reason })
  }
}

const parse = (text, fileName) => ts.createSourceFile(fileName, text, ts.ScriptTarget.Latest, true, fileName.endsWith('x') ? ts.ScriptKind.TSX : ts.ScriptKind.TS)
const needCheck = check => { if (typeof check !== 'function') throw new Error('aw-kit/gates/class-gate：缺少 check（token → 違規原因｜null）'); return check }

// 回傳 [{ line, token, reason }]——頁面規則，只看 className 類位置
export function checkSource(text, fileName, check) {
  needCheck(check)
  const sf = parse(text, fileName)
  const found = []
  const collect = node => {
    if (ts.isBinaryExpression(node) && EQUALITY.has(node.operatorToken.kind)) return // 比較的運算元不是 class
    if (ts.isElementAccessExpression(node)) return collect(node.expression) // 索引鍵不是 class
    if (isStringPart(node)) tokensOf(node, sf, check, found)
    ts.forEachChild(node, collect)
  }
  const isClassName = name => CLASS_PROP.test(nameText(name, sf) ?? '')
  const visit = node => {
    if (ts.isJsxAttribute(node) && CLASS_PROP.test(node.name.getText(sf))) { if (node.initializer) collect(node.initializer); return }
    if (ts.isPropertyAssignment(node) && isClassName(node.name)) return collect(node.initializer)
    // 解構預設值 { className = '…' }、{ className: c = '…' }；參數預設值；變數宣告 const className = '…'
    if (ts.isBindingElement(node) && node.initializer && isClassName(node.propertyName ?? node.name)) return collect(node.initializer)
    if ((ts.isParameter(node) || ts.isVariableDeclaration(node)) && node.initializer && isClassName(node.name)) return collect(node.initializer)
    ts.forEachChild(node, visit)
  }
  visit(sf)
  return found
}

// 元件層用：掃檔案裡每一個字串（cva()、變數、className 都算）
export function checkAllStrings(text, fileName, check) {
  needCheck(check)
  const sf = parse(text, fileName)
  const found = []
  const visit = node => {
    if (isStringPart(node)) tokensOf(node, sf, check, found)
    ts.forEachChild(node, visit)
  }
  visit(sf)
  return found
}

// tailwind.css 的 @source → [{ not, dir（相對 root 的路徑）, exists }]；路徑相對於該 CSS 檔。用 postcss 解析（註解裡的字不算）
export function sourceDirs(cssText, cssFile, root) {
  if (!cssFile || !root) throw new Error('aw-kit/gates/class-gate：sourceDirs 需要 cssFile 與 root（@source 路徑相對於 CSS 檔、回報相對於專案根）')
  const out = []
  postcss.parse(cssText).walkAtRules('source', r => {
    const m = r.params.match(/^(not\s+)?(["'])(.+)\2$/)
    if (!m) { out.push({ not: false, dir: `（看不懂：${r.params}）`, exists: false }); return }
    const abs = resolve(dirname(cssFile), m[3])
    out.push({ not: Boolean(m[1]), dir: relative(root, abs), exists: existsSync(abs) })
  })
  return out
}
