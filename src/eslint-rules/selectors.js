// no-restricted-syntax 用的 selector 組（2026-11-19，inknock ADR 0002 C 批）。
// 原本寫在 inknock eslint.config.js；aw-kit/ui 自己的 lint（eslint.config.js）也要同一組，
// 為了不留兩份抄本，搬到這裡由兩邊引用。每組都是函式：訊息由呼叫端決定（inknock 指向自己的 helper，aw-kit 指向 aw-kit/ui）。
// 負例清單：tests/eslint-rules/selectors.test.js（本套件，RuleTester）、inknock tests/eslint-ime-rule.test.ts 等（讀 inknock 真實設定）。
//
//   import { imeKeyRules } from 'aw-kit/eslint-rules'
//   rules: { 'no-restricted-syntax': ['error', ...imeKeyRules('Enter／Esc 請用 isSubmitEnter()…')] }
//
// ⚠️ flat config 對同名 rule 是後者整段取代前者：同一個檔案套到兩個 no-restricted-syntax block 時，後者要把需要的組全部重列。

const KEY_PROP = "MemberExpression[computed=false][property.name=/^(key|code)$/], MemberExpression[computed=true][property.value=/^(key|code)$/]"

/**
 * 手寫 Enter／Esc 判斷（中文輸入法選字的 Enter／Esc 不可觸發送出或關閉；一律走 isSubmitEnter／isCancelEscape）。
 * 涵蓋：x.key／x.code ===／!==／==／!= 'Enter'|'Escape'（兩邊對調、可選串連 x?.key 也算）、x['key']、
 * switch (x.key) { case 'Enter' }、['Enter', …].includes(x.key)。
 * 已知限制（歸 code review）：先解構 const { key } = e、查表 handlers[e.key]、先存常數陣列再 includes、new Set([...]).has(e.key)、樣板字串 `Enter`。
 */
export function imeKeyRules(message) {
  return [
    { selector: `BinaryExpression[operator=/^[!=]==?$/][right.value=/^(Enter|Escape)$/] > .left:matches(${KEY_PROP})`, message },
    { selector: `BinaryExpression[operator=/^[!=]==?$/][left.value=/^(Enter|Escape)$/] > .right:matches(${KEY_PROP})`, message },
    // 可選串連 e?.key：外層是 ChainExpression
    { selector: `BinaryExpression[operator=/^[!=]==?$/][right.value=/^(Enter|Escape)$/] > ChainExpression.left > :matches(${KEY_PROP})`, message },
    { selector: `BinaryExpression[operator=/^[!=]==?$/][left.value=/^(Enter|Escape)$/] > ChainExpression.right > :matches(${KEY_PROP})`, message },
    { selector: `SwitchStatement:has(> .discriminant:matches(${KEY_PROP})) > SwitchCase > Literal.test[value=/^(Enter|Escape)$/]`, message },
    { selector: "SwitchStatement[discriminant.type='ChainExpression'][discriminant.expression.property.name=/^(key|code)$/] > SwitchCase > Literal.test[value=/^(Enter|Escape)$/]", message },
    { selector: "CallExpression[callee.property.name='includes'][callee.object.type='ArrayExpression']:matches([arguments.0.property.name=/^(key|code)$/][arguments.0.computed=false], [arguments.0.property.value=/^(key|code)$/]):has(ArrayExpression > Literal[value=/^(Enter|Escape)$/])", message },
  ]
}

/** 瀏覽器原生 window.confirm／alert（一律用自家確認框／toast）。已知限制：裸呼叫 confirm() 擋不了（自家確認框具名匯入後同名）。 */
export function nativeDialogRules({ confirm, alert }) {
  return [
    { selector: "MemberExpression[object.name=/^(window|globalThis)$/][property.name=/^(confirm|alert)$/]", message: confirm },
    { selector: "CallExpression[callee.name='alert']", message: alert },
  ]
}

/**
 * `toISOString()`／`toJSON()` 取日期或月份（那是 UTC：UTC+8 的 00:00–08:00 會落在前一天）。
 * 只擋取日期／月份的形狀：後接 slice／substring／substr(0, 7|10)（含方括號 key）或 split('T')。
 * 已知擋不到（歸 code review）：先存變數再 slice、`.replace(/T.*\/, '')`。
 */
export function utcDateRules(message) {
  const src = "[callee.object.type='CallExpression']:matches([callee.object.callee.property.name=/^(toISOString|toJSON)$/], [callee.object.callee.property.value=/^(toISOString|toJSON)$/])"
  return [
    { selector: `CallExpression${src}:matches([callee.property.name=/^(slice|substring|substr)$/], [callee.property.value=/^(slice|substring|substr)$/]):matches([arguments.1.value=7], [arguments.1.value=10])`, message },
    { selector: `CallExpression${src}:matches([callee.property.name='split'], [callee.property.value='split'])[arguments.0.value='T']`, message },
  ]
}

/** 數字欄不可直接寫 inputMode="decimal|numeric" 或 <input type="number">（沒有清洗；一律走共用數字欄元件）。數字欄元件本身要排除。 */
export function numberFieldRules({ inputMode, typeNumber }) {
  return [
    { selector: "JSXAttribute[name.name='inputMode'][value.value=/^(decimal|numeric)$/]", message: inputMode },
    { selector: "JSXOpeningElement[name.name='input'] > JSXAttribute[name.name='type'][value.value='number']", message: typeNumber },
  ]
}
