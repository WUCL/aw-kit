// verified-supabase-write — ported from mh1491 `eslint-rules/verified-supabase-write.js` (2026-09-02),
// TS-aware and parameterised for aw-kit (2026-09-17).
//
// 在 RLS 下，權限不足的 update／delete 會「靜默失敗」：error = null 卻 0 列受影響。
// 唯一能察覺的方法是把受影響列取回來——沒接 .select() 就是**在資訊上不可能**知道寫入有沒有
// 生效，不是風格問題。
//
// 這條規則因此擋的是「寫了卻拿不回結果」，不是「沒用 verifyWrite」。通過的形式有三種：
//   1. 包在 verifyWrite(...) 裡（helper 內部會 .select()）
//   2. 鏈尾自己接 .select()（呼叫端自行判斷列數）
//   3. 寫入結果先存成變數，該變數之後被傳進 verifyWrite（條件式 .eq() 寫法）
//
// 合法可能影響 0 列的寫入（全量改歷史資料、批次回填）本來就不該用列數判斷成敗——
// 那些請加 eslint-disable-next-line 並在註解寫明「為什麼 0 列是正常結果」。強制寫理由是
// 刻意的：沒有落地機制的規範會逐步回流。
//
// 已知限制（刻意不補）：規則防的是「不小心漏了」，不是「刻意繞過」——後者本來就有具名
// disable 註解這條正門；把規則加固到能擋 shadow 掉 verifyWrite、或先 await 再補呼叫
// verifyWrite 這類形狀，不會換到任何實質保護。
//
// TS：向上／向下穿越鏈時把 `as`／`satisfies`／`!`／括號視為透明（TSAsExpression、
// TSSatisfiesExpression、TSNonNullExpression）。沒有這一層，`(x.update() as any).eq().select()`
// 會被截斷成「沒有 select」而誤報——Codex 2026-09-17 以 TS parser 實測。
//
// Options：
//   clientNames   認定為 supabase client 的識別字（預設 ['supabase']）
//   verifyFnName  形式 1／3 的 helper 名稱（預設 'verifyWrite'）

const WRITE_METHODS = new Set(['update', 'delete'])
const TS_WRAPPERS = new Set(['TSAsExpression', 'TSSatisfiesExpression', 'TSNonNullExpression', 'TSTypeAssertion'])

// 往內剝掉 TS wrapper：`(expr as T)!` → expr
function unwrap(node) {
  let cur = node
  while (cur && TS_WRAPPERS.has(cur.type)) cur = cur.expression
  return cur
}

// 往下走一層鏈：CallExpression → callee、MemberExpression → object，途中剝 wrapper
function chainStep(node) {
  const n = unwrap(node)
  if (n?.type === 'CallExpression') return unwrap(n.callee)
  if (n?.type === 'MemberExpression') return unwrap(n.object)
  return null
}

// 沿著鏈往下走到根識別字：supabase.from('t').update({}) → Identifier(supabase)
function chainRoot(node) {
  let cur = unwrap(node)
  for (;;) {
    const next = chainStep(cur)
    if (!next) break
    cur = next
  }
  return cur
}

// 從鏈的最外層往下收集所有 method 名稱
function chainMethods(outer) {
  const names = []
  let cur = unwrap(outer)
  while (cur && (cur.type === 'CallExpression' || cur.type === 'MemberExpression')) {
    if (cur.type === 'MemberExpression' && cur.property?.type === 'Identifier') names.push(cur.property.name)
    cur = chainStep(cur)
  }
  return names
}

// 往上走到這條鏈的最外層：.update({}) → .update({}).eq(...) → ((.update({}) as any).eq(...)).select()
function outermostOfChain(node) {
  let cur = node
  for (;;) {
    const p = cur.parent
    if (p && TS_WRAPPERS.has(p.type) && p.expression === cur) { cur = p; continue }
    if (p?.type === 'MemberExpression' && p.object === cur) { cur = p; continue }
    if (p?.type === 'CallExpression' && p.callee === cur) { cur = p; continue }
    return cur
  }
}

// 認定為 supabase query builder：鏈根是 client 名、鏈上有 .from(...)、或鏈根是某個變數而
// 該變數的初始值本身是 supabase 鏈（`const db = supabase`、`const q = supabase.from('t')`）。
// Array.from／Object.fromEntries 不會再接 .update()／.delete()，實務上不構成誤判來源。
function isSupabaseChain(node, context, clientNames, depth = 0) {
  const root = chainRoot(node)
  if (root?.type === 'Identifier' && clientNames.has(root.name)) return true
  if (chainMethods(node).includes('from')) return true
  if (depth >= 3) return false   // 防環狀／過深追蹤
  if (root?.type !== 'Identifier') return false
  const variable = context.sourceCode.getScope(node).references
    .find(r => r.identifier === root)?.resolved
  return (variable?.defs || []).some(def =>
    def.node?.type === 'VariableDeclarator' && def.node.init &&
    isSupabaseChain(def.node.init, context, clientNames, depth + 1))
}

// 這個節點（可能包著 wrapper）是不是 verifyFn(...) 的引數
function isVerifyArg(node, verifyFnName) {
  let cur = node
  while (cur.parent && TS_WRAPPERS.has(cur.parent.type) && cur.parent.expression === cur) cur = cur.parent
  const p = cur.parent
  return p?.type === 'CallExpression' &&
    p.callee?.type === 'Identifier' && p.callee.name === verifyFnName &&
    p.arguments.includes(cur)
}

export default {
  meta: {
    type: 'problem',
    docs: { description: 'supabase 的 update／delete 必須取回受影響列，否則 RLS 靜默失敗無法察覺' },
    schema: [{
      type: 'object',
      properties: {
        clientNames: { type: 'array', items: { type: 'string' }, minItems: 1 },
        verifyFnName: { type: 'string' },
      },
      additionalProperties: false,
    }],
    messages: {
      unverified: 'supabase {{method}} 沒有取回受影響列：RLS 違反時 error = null 且 0 列受影響，這樣寫無法察覺。請包 {{verifyFnName}}(...)、或在鏈尾接 .select() 自行判斷列數。若此處合法可能影響 0 列（批次改歷史資料），加 eslint-disable-next-line 並註明理由。',
    },
  },
  create(context) {
    const opts = context.options[0] || {}
    const clientNames = new Set(opts.clientNames || ['supabase'])
    const verifyFnName = opts.verifyFnName || 'verifyWrite'

    return {
      CallExpression(node) {
        const callee = unwrap(node.callee)
        if (callee?.type !== 'MemberExpression') return
        if (callee.property?.type !== 'Identifier') return
        if (!WRITE_METHODS.has(callee.property.name)) return
        if (!isSupabaseChain(callee.object, context, clientNames)) return

        const outer = outermostOfChain(node)

        // 形式 2：鏈尾自己取回列
        if (chainMethods(outer).includes('select')) return
        // 形式 1：直接包在 verifyFn 裡
        if (isVerifyArg(outer, verifyFnName)) return

        // 形式 3：先存成變數，之後才交給 verifyFn
        const parent = outer.parent
        let variable = null
        if (parent?.type === 'VariableDeclarator' && parent.init === outer) {
          variable = context.sourceCode.getDeclaredVariables(parent)[0]
        } else if (parent?.type === 'AssignmentExpression' && parent.right === outer &&
                   parent.left?.type === 'Identifier') {
          variable = context.sourceCode.getScope(node).references
            .find(r => r.identifier === parent.left)?.resolved
        }
        if (variable?.references.some(ref => isVerifyArg(ref.identifier, verifyFnName))) return

        context.report({
          node,
          messageId: 'unverified',
          data: { method: callee.property.name, verifyFnName },
        })
      },
    }
  },
}
