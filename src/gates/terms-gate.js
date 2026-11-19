// 畫面用詞閘門（check:terms）的判斷核心（2026-11-19 自 inknock scripts/check-terms.mjs 搬入，inknock ADR 0002 E 批）——純函式，不讀檔。
// 只看字串／樣板字串／JSX 文字（用 TypeScript 解析器），註解不算——註解裡記錄歷史用詞是正當的。
// 用詞表是產品的（業務舊詞、金額寫法），由消費端傳入（沒帶就丟錯）；aw-kit 自己不帶用詞表，也不在自掃裡跑這道。
import ts from 'typescript'

/**
 * @param {string} file 回報用的檔名（也決定是否以 TSX 解析）
 * @param {string} text 原始碼
 * @param {{ deprecated?: Record<string, string>, forbidden?: Record<string, string> }} dict
 *   deprecated（舊詞）／forbidden（禁用字）→ 完整的修正說明，原樣印在箭頭後（訊息全由用詞表帶入，閘門不寫任何產品的慣例）
 * @returns {string[]} 一筆一行的違規描述
 */
export function scanTerms(file, text, { deprecated = {}, forbidden = {} } = {}) {
  // 沒帶用詞表＝什麼都不擋、閘門靜默變綠，所以直接丟錯
  if (!Object.keys(deprecated).length && !Object.keys(forbidden).length) throw new Error('aw-kit/gates/terms-gate：沒有用詞表（deprecated／forbidden 至少一項）')
  const hits = []
  const sf = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true, file.endsWith('x') ? ts.ScriptKind.TSX : ts.ScriptKind.TS)
  const visit = node => {
    const k = node.kind
    if (k === ts.SyntaxKind.StringLiteral || k === ts.SyntaxKind.NoSubstitutionTemplateLiteral ||
        k === ts.SyntaxKind.TemplateHead || k === ts.SyntaxKind.TemplateMiddle || k === ts.SyntaxKind.TemplateTail ||
        k === ts.SyntaxKind.JsxText) {
      const s = k === ts.SyntaxKind.JsxText ? node.getText(sf) : node.text
      for (const [word, key] of Object.entries(deprecated)) {
        if (s.includes(word)) {
          const { line } = sf.getLineAndCharacterOfPosition(node.getStart(sf))
          hits.push(`${file}:${line + 1}  「${word}」→ ${key}`)
        }
      }
      for (const [word, use] of Object.entries(forbidden)) {
        if (s.includes(word)) {
          const { line } = sf.getLineAndCharacterOfPosition(node.getStart(sf))
          hits.push(`${file}:${line + 1}  「${word}」→ ${use}`)
        }
      }
    }
    ts.forEachChild(node, visit)
  }
  visit(sf)
  return hits
}
