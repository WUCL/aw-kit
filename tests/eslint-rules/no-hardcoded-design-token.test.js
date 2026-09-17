// 自 inknock eslint.config.js 三條 no-restricted-syntax 改寫成具名規則。
// 改寫理由：可組合、可命名、不會被 flat-config 另一個 block 的同名 no-restricted-syntax
// 整段覆蓋（inknock 2026-09-16 實測：src/features 內三條全部靜默失效）。邏輯必須同等：
// Property key 為 fontSize／borderRadius 且值為純數字 literal；fontWeight 只擋 700／800。
import { makeTester } from './_ruleTester.js'
import rule from '../../src/eslint-rules/no-hardcoded-design-token.js'

const ruleTester = makeTester()

ruleTester.run('no-hardcoded-design-token', rule, {
  valid: [
    // 走 token
    "const s = { fontSize: T.fontSize.md, borderRadius: T.radius.sm, fontWeight: T.weight.bold }",
    // 字串值（'1rem'、'50%'）不是本規則管的形狀
    "const s = { fontSize: '14px', borderRadius: '50%' }",
    // fontWeight 600 以下合法（中文封頂 600）
    "const s = { fontWeight: 600 }",
    "const s = { fontWeight: 500 }",
    // 其他 key 的數字不管
    "const s = { lineHeight: 1.5, zIndex: 10, padding: 8 }",
    // 變數／運算式
    "const s = { fontSize: size, borderRadius: r * 2 }",
    // 字串 key 形式也算 key.name 之外——與 inknock selector（key.name）行為一致，不管
    "const s = { 'fontSize': 14 }",
    // JSX style 用 token
    "<div style={{ fontSize: T.fontSize.sm }} />",
    // options：關掉某一類
    { code: "const s = { fontWeight: 700 }", options: [{ fontWeight: false }] },
    { code: "const s = { fontSize: 14 }", options: [{ fontSize: false }] },
    { code: "const s = { borderRadius: 4 }", options: [{ borderRadius: false }] },
  ],
  invalid: [
    { code: "const s = { fontSize: 14 }", errors: [{ messageId: 'fontSize' }] },
    { code: "const s = { borderRadius: 8 }", errors: [{ messageId: 'borderRadius' }] },
    { code: "const s = { fontWeight: 700 }", errors: [{ messageId: 'fontWeight' }] },
    { code: "const s = { fontWeight: 800 }", errors: [{ messageId: 'fontWeight' }] },
    { code: "<div style={{ fontSize: 12, borderRadius: 4 }} />", errors: [{ messageId: 'fontSize' }, { messageId: 'borderRadius' }] },
    // 小數也是數字字面值（inknock 的 /^[0-9]+$/ 只抓整數；本規則以 typeof number 判定，涵蓋更廣——
    // 這是刻意的差異：`fontSize: 0.875` 同樣是硬編）
    { code: "const s = { fontSize: 0.875 }", errors: [{ messageId: 'fontSize' }] },
    // options 只關一類，其他仍亮
    { code: "const s = { fontSize: 14, fontWeight: 700 }", options: [{ fontWeight: false }], errors: [{ messageId: 'fontSize' }] },
  ],
})
