// no-inline-date-format — ported from inknock `eslint.config.js` (C2 2026-09-16 formatter
// consolidation), rewritten as a named rule for aw-kit (2026-09-17).
//
// 定位：**特定 AST 形狀的防呆**，不是「完整禁止 inline 日期」。
// 形狀＝同一個 TemplateLiteral 內同時出現 Date getter 呼叫（getFullYear／getMonth／getDate／
// getHours／getMinutes／getSeconds）與 `.padStart(...)` 呼叫——只有真的在手拼日期字串時才兩者都命中。
//
// ⚠️ 不可只禁 `padStart(2, '0')`：時段刻度 `${String(h).padStart(2,'0')}:00` 也用它（h 只是數字）。
// ⚠️ 已知盲點（刻意不擴大）：padStart 藏在 helper 裡（`const pad = n => …`，template 只呼叫 `pad()`），
//    或先 `const y = d.getFullYear()` 再拼字串，都抓不到。放寬到「template 內有 Date getter」會誤傷
//    所有合法的 `${d.getFullYear()} 年`，把真訊號淹在假陽性裡。規則抓的是最常見、成本最低的那一半，
//    其餘靠 code review。
//
// formatter 的 API 與實作位置由專案端持有：這條規則**不放白名單檔**，只提供 `message` option
// 讓專案把提示指向自己的 formatter（例如 `src/shared/format.ts` 的 fmtYmd）。合法的實作處
// （formatter 本身）本來就會出現這個形狀，請在 eslint config 用 `files`／`ignores` 排除，
// 不要把它們的路徑寫進套件。

const DATE_GETTERS = new Set(['getFullYear', 'getMonth', 'getDate', 'getHours', 'getMinutes', 'getSeconds'])

// 走訪子樹，找是否有符合 predicate 的 CallExpression（等同 esquery 的 :has()）
function hasCall(node, predicate) {
  if (!node || typeof node.type !== 'string') return false
  if (node.type === 'CallExpression' && predicate(node)) return true
  for (const key of Object.keys(node)) {
    if (key === 'parent' || key === 'loc' || key === 'range') continue
    const child = node[key]
    if (Array.isArray(child)) {
      for (const c of child) if (c && typeof c.type === 'string' && hasCall(c, predicate)) return true
    } else if (child && typeof child.type === 'string') {
      if (hasCall(child, predicate)) return true
    }
  }
  return false
}

const calleeName = (call) =>
  call.callee?.type === 'MemberExpression' && call.callee.property?.type === 'Identifier'
    ? call.callee.property.name
    : null

export default {
  meta: {
    type: 'suggestion',
    docs: { description: '手拼日期字串（Date getter + padStart 同在一個 template）請改用專案的 formatter' },
    schema: [{
      type: 'object',
      properties: { message: { type: 'string' } },
      additionalProperties: false,
    }],
    messages: {
      inlineDate: '手拼日期字串請改用專案的 formatter，不要重刻 Date getter + padStart 組合',
      custom: '{{message}}',
    },
  },
  create(context) {
    const custom = context.options[0]?.message

    return {
      TemplateLiteral(node) {
        const hasGetter = hasCall(node, (c) => DATE_GETTERS.has(calleeName(c)))
        if (!hasGetter) return
        const hasPad = hasCall(node, (c) => calleeName(c) === 'padStart')
        if (!hasPad) return
        if (custom) context.report({ node, messageId: 'custom', data: { message: custom } })
        else context.report({ node, messageId: 'inlineDate' })
      },
    }
  },
}
