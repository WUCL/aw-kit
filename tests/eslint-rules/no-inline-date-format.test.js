// 自 inknock eslint.config.js 的日期 formatter selector 改寫。
// 定位是「特定 AST 形狀的防呆」：同一個 TemplateLiteral 內同時出現 Date getter 呼叫與
// padStart 呼叫。**不宣稱完整禁止 inline 日期**——helper／中間變數是已知盲點（見規則檔頭）。
import { makeTester } from './_ruleTester.js'
import rule from '../../src/eslint-rules/no-inline-date-format.js'

const ruleTester = makeTester()

ruleTester.run('no-inline-date-format', rule, {
  valid: [
    // 走 formatter
    "const s = fmtYmd(d)",
    // 只有 padStart、沒有 Date getter：CalendarPage 的時段刻度 `09:00`（h 只是數字）——
    // 這是 inknock 一開始踩到的誤傷，不可只禁 padStart
    "const s = `${String(h).padStart(2, '0')}:00`",
    // 只有 Date getter、沒有 padStart：`${d.getFullYear()} 年` 是合法寫法
    "const s = `${d.getFullYear()} 年 ${d.getMonth() + 1} 月`",
    // 兩者出現在不同的 template 裡
    "const a = `${d.getFullYear()}`; const b = `${String(m).padStart(2, '0')}`",
    // 已知盲點（刻意不抓，這裡當文件）：padStart 藏在 helper 裡
    "const pad = n => String(n).padStart(2, '0'); const s = `${d.getFullYear()}-${pad(d.getMonth() + 1)}`",
    // 已知盲點：先存中間變數再拼
    "const y = d.getFullYear(); const s = `${y}-${String(m).padStart(2, '0')}`",
    // 非 template literal 的字串相接不在形狀內
    "const s = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0')",
  ],
  invalid: [
    {
      code: "const s = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`",
      errors: [{ messageId: 'inlineDate' }],
    },
    {
      code: "const s = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`",
      errors: [{ messageId: 'inlineDate' }],
    },
    {
      // getSeconds 也在 getter 清單內
      code: "const s = `${d.getSeconds()}${String(x).padStart(2, '0')}`",
      errors: [{ messageId: 'inlineDate' }],
    },
    {
      // 巢狀 template：外層含兩者 → 報；內層只有 padStart → 不報（與 :has() 同等）
      code: "const s = `${d.getFullYear()}${`${String(m).padStart(2, '0')}`}`",
      errors: [{ messageId: 'inlineDate' }],
    },
    {
      // JSX 裡的 template
      code: "<span>{`${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}`}</span>",
      errors: [{ messageId: 'inlineDate' }],
    },
    {
      // options.message 可覆蓋提示（專案端指向自己的 formatter 位置）
      code: "const s = `${d.getFullYear()}-${String(m).padStart(2, '0')}`",
      options: [{ message: '請用 src/shared/format.ts 的 fmtYmd' }],
      errors: [{ message: '請用 src/shared/format.ts 的 fmtYmd' }],
    },
  ],
})
