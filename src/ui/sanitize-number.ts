// 2026-11-19 自 inknock `src/shared/number-input.ts（改名：避免與日後搬入的 NumberInput 元件 number-input.tsx 同名）` 原樣搬入（inknock ADR 0002 C 批）；註解中的 DECISIONS／CLAUDE.md／日期指 inknock 的紀錄。
/**
 * 數字輸入的清洗（2026-09-29 升級為全站唯一實作，`<NumberInput>` 的核心；DECISIONS 同日）。
 *
 * 不用 `<input type="number">`：它在 iOS 會帶出上下箭頭與滾輪誤觸，
 * 且空字串與 NaN 難分（本專案多處用「空字串＝沒填」當哨兵）。
 * 改成 `inputMode` ＋ 這支清洗函式，值永遠是可直接 `Number()` 的字串或空字串。
 *
 * 規則（對標 Shopify Polaris TextField，刻意不同處見 DECISIONS）：
 * - **在內容改變時清洗**，不是按鍵時——這樣擋得到貼上與中文輸入法的全形字。
 * - **全形轉半形，不刪除**（CLAUDE.md 形狀表「轉義，不要刪除」）：「１２．５」→「12.5」。
 * - 千分位逗號（半形、全形）直接拿掉：「1,200」→「1200」。
 * - 其餘非數字一律濾掉；不放行 e／+（本專案沒有科學記號需求）。
 * - `decimal` 只留第一個小數點；`integer` 保留第一個小數點本身、丟掉點之後的數字（1200.50 → `1200.`，
 *   逐鍵打字才不會因吃掉點而把 `1200.5` 接成 12005）；`digits` 從第一個小數點起整段截掉（1200.50 → 1200）。
 * - integer 的值因此**可能以 `.` 結尾**：`Number('1200.')`＝1200 可直接用，但 `/^\d+$/`、`parseInt` 以外的嚴格比對要先 `normalizeInteger()`。
 * - `allowNegative` 時只保留開頭的一個負號。
 * - `digits` 與 `integer` 差在語意與小數點：`digits` 是代碼（末五碼、電話），
 *   開頭的 0 有意義——所以這裡**從不去掉前導 0**，由呼叫端決定要不要 `Number()`。
 */
export type NumberKind = 'decimal' | 'integer' | 'digits'

export function sanitizeNumber(v: string, kind: NumberKind = 'decimal', allowNegative = false): string {
  // 全形數字／小數點／負號 → 半形；逗號（含全形、頓號）視為千分位直接拿掉
  const half = v
    .replace(/[０-９]/g, ch => String.fromCharCode(ch.charCodeAt(0) - 0xFEE0))
    .replace(/[．。]/g, '.')
    .replace(/[－—–]/g, '-')
    .replace(/[,，、]/g, '')
  const negative = allowNegative && half.trimStart().startsWith('-')
  // digits：從第一個小數點起整段丟掉（代碼不該有點）。
  // integer：**保留第一個小數點本身**，只丟掉點之後的數字。
  // 為什麼不能連點一起丟：受控輸入逐鍵打字時，「1200.」若被清成「1200」，下一鍵 5 就接成「12005」，
  // 金額靜默放大 10 倍（「1,200.00」貼上會變 120000）；保留結尾的點，使用者看得到點還在、後面的數字打不進去，
  // 且 `Number('1200.')` 仍是 1200（深度審查 2026-10-28 A2；原「刪點」版本見 code review 2026-09-29）。
  const keepDot = kind !== 'digits'
  // split 至少回一個元素；`?? ''` 只為 noUncheckedIndexedAccess（aw-kit 最嚴設定），行為不變
  const cleaned = (kind === 'digits' ? (half.split('.')[0] ?? '') : half).replace(keepDot ? /[^\d.]/g : /\D/g, '')
  const i = cleaned.indexOf('.')
  const single = i === -1
    ? cleaned
    : kind === 'integer'
      ? cleaned.slice(0, i + 1) // 保留點、丟掉點之後所有內容
      : cleaned.slice(0, i + 1) + cleaned.slice(i + 1).replace(/\./g, '')
  return negative ? `-${single}` : single
}

/** integer 欄值去掉結尾的 `.`（「1200.」→「1200」）；送出、驗證、字串比較前使用。 */
export function normalizeInteger(v: string): string {
  return v.endsWith('.') ? v.slice(0, -1) : v
}

/** 舊名保留：等同 `sanitizeNumber(v, 'decimal')`。新程式請直接用 `<NumberInput>`。 */
export function digitsOnly(v: string): string {
  return sanitizeNumber(v, 'decimal')
}
