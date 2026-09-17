// no-hardcoded-design-token — ported from inknock `eslint.config.js` (three `no-restricted-syntax`
// selectors, 2026-08 style-plan §8.3), rewritten as a named rule for aw-kit (2026-09-17).
//
// 為什麼要改成具名規則而不是留 `no-restricted-syntax`：flat config 對同一個 rule 是「後者整個
// 取代前者」，不是合併。inknock 在 src/features 加了第二個 no-restricted-syntax block（日期
// formatter）之後，設計代幣三條在 src/features **全域靜默失效**——而那正是全站 UI 所在。
// 具名規則各自獨立，不會互相覆蓋；也能被個別開關、個別設 severity。
// （不是因為 inline selector 不能測——no-restricted-syntax 本來就能上 RuleTester。）
//
// 判定（與 inknock selector 同等）：ObjectExpression 的 Property，key 為識別字
//   fontSize     值為數字字面值 → 報（用 T.fontSize.*）
//   borderRadius 值為數字字面值 → 報（用 T.radius.*）
//   fontWeight   值為 700／800 → 報（中文封頂 600；純數字／拉丁的合法用法加 disable 註解寫理由）
// 字串值（'14px'、'50%'）與變數／運算式不在管轄範圍。
// 刻意差異：inknock 用 value.raw=/^[0-9]+$/ 只抓整數，這裡以 `typeof value === 'number'` 判定，
// 小數（`fontSize: 0.875`）同樣是硬編。
//
// Options（每類可獨立關掉）：{ fontSize?: boolean, borderRadius?: boolean, fontWeight?: boolean }

const HEAVY_WEIGHTS = new Set([700, 800])

export default {
  meta: {
    type: 'suggestion',
    docs: { description: 'fontSize／borderRadius／fontWeight 不可硬編數字，請用設計代幣 T.*' },
    schema: [{
      type: 'object',
      properties: {
        fontSize: { type: 'boolean' },
        borderRadius: { type: 'boolean' },
        fontWeight: { type: 'boolean' },
      },
      additionalProperties: false,
    }],
    messages: {
      fontSize: '字級請用 T.fontSize.*，不要硬編數字',
      borderRadius: '圓角請用 T.radius.*，不要硬編數字',
      fontWeight: 'fontWeight 700／800 僅限純數字與拉丁；中文封頂 600。合法用法請加 eslint-disable-next-line 並寫明理由',
    },
  },
  create(context) {
    const opts = { fontSize: true, borderRadius: true, fontWeight: true, ...(context.options[0] || {}) }

    return {
      Property(node) {
        if (node.computed || node.key?.type !== 'Identifier') return
        const value = node.value
        if (value?.type !== 'Literal' || typeof value.value !== 'number') return
        const key = node.key.name

        if (key === 'fontSize' && opts.fontSize) {
          context.report({ node, messageId: 'fontSize' })
        } else if (key === 'borderRadius' && opts.borderRadius) {
          context.report({ node, messageId: 'borderRadius' })
        } else if (key === 'fontWeight' && opts.fontWeight && HEAVY_WEIGHTS.has(value.value)) {
          context.report({ node, messageId: 'fontWeight' })
        }
      },
    }
  },
}
