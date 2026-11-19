// 設計規範閘門（check:style）的判斷核心（2026-11-19 自 inknock scripts/check-style.mjs 搬入，inknock ADR 0002 E 批）——純函式，不讀檔。
// 規則本身不變；專案相關的部分（色票、原生控制項的擁有者、標籤擁有者、哪些檔算元件層）由 createStyleRules() 的參數帶入。
// aw-kit/ui 自己的那一份擁有者名單在 UI_OWNERS／UI_TAG_OWNERS（相對 src/ui 的檔名），消費端加上自己的標籤前綴合併。
//
// 例外：違規行的上一行／同一行／下兩行寫 `audit-ok: <規則 id> — 理由`。
// 同一處也要 ESLint 例外時，寫成一行：`eslint-disable-next-line <eslint 規則> -- 理由；audit-ok: <規則 id> — 理由`
// （ESLint 只看 `--` 前的規則名，這裡只找 `audit-ok:` 字樣，兩者互不干擾）。
// 負例清單：tests/gates/style-gate.test.js。

/** aw-kit/ui 內擁有原生控制項的元件（相對 src/ui）：只有這些檔可以寫裸 <button>／<input>／<select>／<textarea> */
export const UI_OWNERS = {
  button: ['button.tsx', 'icon-button.tsx', 'link-button.tsx', 'export-button.tsx', 'switch.tsx', 'tabs.tsx'],
  input: ['input.tsx', 'number-input.tsx', 'checkbox.tsx'],
  select: ['select.tsx'],
  textarea: ['textarea.tsx'],
}
/** aw-kit/ui 內定義標籤長相的元件（相對 src/ui） */
export const UI_TAG_OWNERS = ['chip.tsx']

/** 把 UI_OWNERS／UI_TAG_OWNERS／theme.ts（色票定義處）加上標籤前綴（消費端 'aw-kit/src/ui/'、aw-kit 自掃 'src/ui/'） */
export function uiOwners(prefix) {
  return {
    owners: Object.fromEntries(Object.entries(UI_OWNERS).map(([tag, files]) => [tag, files.map(f => prefix + f)])),
    tagOwners: UI_TAG_OWNERS.map(f => prefix + f),
    paletteSkip: [`${prefix}theme.ts`],   // aw-kit/ui 的色票定義處：消費端與 aw-kit 自掃同一個判準
  }
}

/** theme.ts 原始碼 → 色票（大寫 hex 的 Set）。SERIES（分類色）不算合法色：它只該經 `SERIES.*` 引用，直接寫它的 hex 仍屬違規 */
export function readPalette(themeSources) {
  return new Set((themeSources.join('\n').replace(/export const SERIES = \{[\s\S]*?\} as const/g, '').match(/'#[0-9A-Fa-f]{6}'/g) ?? [])
    .map(s => s.replaceAll("'", '').toUpperCase()))
}

/**
 * @param {object} o
 * @param {Set<string>} o.palette          合法色（readPalette）
 * @param {string[]} [o.allowHex]          色票外但允許的色
 * @param {Record<'button'|'input'|'select'|'textarea', string[]>} o.owners  原生控制項只允許出現在擁有它的元件檔
 * @param {string[]} o.tagOwners           標籤的長相只在這些元件定義
 * @param {(file: string) => boolean} o.isComponentLayer  元件層（擁有 <label>／可點區塊的實作）不掃 handLabel／clickDiv
 * @param {string[]} [o.paletteSkip]       色票的定義處，不掃 palette
 */
export function createStyleRules({ palette, allowHex = ['#FFFFFF'], owners, tagOwners, isComponentLayer, paletteSkip = [] }) {
  if (!(palette instanceof Set) || !owners || !Array.isArray(tagOwners) || typeof isComponentLayer !== 'function')
    throw new Error('aw-kit/gates/style-gate：createStyleRules 需要 palette（Set）、owners、tagOwners、isComponentLayer')
  const PALETTE = palette
  const ALLOW_HEX = new Set(allowHex.map(h => h.toUpperCase()))
  const OWNER = owners
  const TAG_OWNERS = tagOwners
  return [
  { id: 'palette', desc: '色票外的硬編顏色',
    // 色票的定義處（含 SERIES）不掃
    scan: (src, file) => paletteSkip.includes(file) ? [] : [...src.matchAll(/#[0-9A-Fa-f]{6}\b/g)].filter(m => !PALETTE.has(m[0].toUpperCase()) && !ALLOW_HEX.has(m[0].toUpperCase())) },
  { id: 'bareControl', desc: '裸 <button>／<input>／<select>／<textarea>（請用共用元件）',
    // radio／file／hidden 沒有對應的共用元件，不算違規（2026-09-30）；checkbox 自 2026-11-15 有共用 Checkbox，改為違規。看 tag 起點後到第一個 `/>` 或下一個 `<` 為止
    scan: (src, file) => [...src.matchAll(/<(button|input|select|textarea)[\s>/]/g)].filter(m => {
      if ((OWNER[m[1]] ?? []).includes(file)) return false
      if (m[1] !== 'input') return true
      const rest = src.slice(m.index + 1, m.index + 600)
      const end = Math.min(...['/>', '<'].map(t => { const i = rest.indexOf(t); return i < 0 ? rest.length : i }))
      return !/type=["'](radio|file|hidden)["']/.test(rest.slice(0, end))
    }) },
  { id: 'labelFor', desc: '<label> 缺 htmlFor',
    scan: src => [...src.matchAll(/<label(?![^>]*htmlFor)[^>]*>/g)] },
  // 2026-11-16（第 13 批 review）：欄位標籤全站一支（FieldLabel／FormField）。原本 labelFor 看得到頁面上的 <label>，
  // 換成 <FormField label=…> 後 <label> 在 src/shared/ui 裡產生，漏給 htmlFor 時閘門就看不到了——這條補上：
  // FormField 有 label 卻沒有 htmlFor、也不是 group（一組控制項）→ 標籤沒對到任何欄位（報讀只念「編輯文字」、點標籤不聚焦）。
  // 以大括號配對找標籤結尾（labelAction／helper 裡的 JSX、箭頭函式的 `>` 不會誤判）。
  { id: 'fieldLabelFor', desc: '<FormField label> 缺 htmlFor（一組控制項請加 group）',
    scan: src => [...src.matchAll(/<FormField\b/g)].filter(m => {
      const tag = jsxOpenTag(src, m.index)
      // group 只認不帶值的寫法：`group={cond}` 在 cond 為假時就是沒對到欄位的 <label>，不算豁免（補審）
      return /\slabel=/.test(tag) && !/\shtmlFor=/.test(tag) && !/\sgroup(?=[\s>/])/.test(tag)
    }).map(m => tagMatch(src, m.index)) },
  // 2026-11-17（第 16 批 review）：只查「有沒有寫 htmlFor」擋不住打錯字或漏給 id——同檔要找得到同一個值的 id=。
  // 比對寫法字面（`htmlFor={`${fid}-name`}` ↔ `id={`${fid}-name`}`、`htmlFor="x"` ↔ `id="x"`；去掉空白、單雙引號視同）；id 由別的檔產生時寫 audit-ok。
  // 補審：同一檔兩個元件用同名 id（StaffPanel 建立／編輯）時，只問「有沒有」會被另一個元件的 id 騙過 → 改比「次數」：同值的 id 不可少於 htmlFor。
  //   `data-testid=` 等以 id= 結尾的屬性不算（前面不可接英數或連字號）。已知限制：同值 id 數量夠、但放錯元件（A 的 id 在 B 裡多寫一份）抓不到。
  { id: 'labelTarget', desc: 'htmlFor 在同檔找不到對應的 id（打錯字或漏給 id，標籤又沒對到欄位）',
    scan: src => {
      const norm = v => v.replace(/\s+/g, '').replace(/^'(.*)'$/, '"$1"')
      const VAL = String.raw`(\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}|"[^"]*"|'[^']*')`
      const ids = new Map()
      for (const m of src.matchAll(new RegExp(String.raw`(?<![\w-])id=` + VAL, 'g'))) { const k = norm(m[1]); ids.set(k, (ids.get(k) ?? 0) + 1) }
      const used = new Map()
      return [...src.matchAll(/<(?:FormField|label)\b/g)].map(m => tagMatch(src, m.index)).filter(t => {
        const v = t[0].match(new RegExp(String.raw`\shtmlFor=` + VAL))
        if (!v) return false
        const k = norm(v[1]); const n = (used.get(k) ?? 0) + 1; used.set(k, n)
        return n > (ids.get(k) ?? 0)
      })
    } },
  // 同批：頁面上自己寫字級的 <label> 就是又一種標籤外觀。欄位標籤用 FormField／FieldLabel；
  // 勾選框／開關旁的選項文字、工具列裡的行內標籤不是欄位標籤，寫 audit-ok 說明。只看 <label>（div／span 當標籤抓不到，已知限制）。
  { id: 'handLabel', desc: '<label> 自己寫字級（欄位標籤用 FormField／FieldLabel）',
    scan: (src, file) => isComponentLayer(file) ? [] : [...src.matchAll(/<label\b/g)].filter(m => /\bfontSize\b/.test(jsxOpenTag(src, m.index))).map(m => tagMatch(src, m.index)) },
  // 2026-11-17（第 20 批）：可點的 div／span／li 沒有 role＝鍵盤到不了、報讀不知道能按。可點的區塊用 `Pressable`（aw-kit/ui/pressable）；
  // 遮罩點一下關閉、只攔截冒泡（stopPropagation）、有鍵盤替代路徑的大量格子（行事曆時段）寫 audit-ok 說明。src/shared/ui 是元件擁有者，不掃。
  { id: 'clickDiv', desc: '可點的 div／span／li 沒有互動角色＋tabIndex（鍵盤到不了；整塊可點用 Pressable）',
    scan: (src, file) => isComponentLayer(file) ? [] : [...src.matchAll(/<(?:div|span|li)\b/g)].map(m => tagMatch(src, m.index)).filter(t => {
      if (!/\sonClick=/.test(t[0])) return false
      // 補審：只看「有沒有寫 role」會放過 role="row"／"presentation"、role={cond ? 'button' : undefined}、沒有 tabIndex 的寫法——
      //   要是固定的互動角色字串，且有 tabIndex，才算鍵盤到得了
      const interactiveRole = /\srole=["'](button|switch|link|checkbox|radio|tab|menuitem|menuitemradio|option)["']/.test(t[0])
      // 補審：tabIndex={-1} 鍵盤到不了；停得到但沒有按鍵處理＝Enter／空白鍵沒反應
      const focusable = /\stabIndex=/.test(t[0]) && !/\stabIndex=\{?\s*["']?-1/.test(t[0])
      const keyHandled = /\son(KeyDown|KeyUp)=/.test(t[0])
      return !(interactiveRole && focusable && keyHandled)
    }) },
  { id: 'softShadow', desc: '柔邊陰影（只給 menu／panel／modal，用 T.shadow.*）',
    scan: src => [...src.matchAll(/boxShadow:\s*'0 \d+px \d+px[^']*'/g)] },
  { id: 'accentAsText', desc: 'accent600 當一般文字色（主色只給「這裡有動作」）',
    scan: src => [...src.matchAll(/color:\s*T\.accent600/g)] },
  // 2026-10-07（DECISIONS mockup 106 E）：完整外框／控制項框線不可用 T.line（容器內分隔線專用）。
  // 輸入框與按鈕一再出現「偏淡的框」，根因都是呼叫端把框線寫成 T.line；外框用 lineStrong、控制項用 lineControl。
  // borderBottom／borderTop 等單邊分隔線不在此限。
  { id: 'faintBorder', desc: '完整外框或控制項框線用了 T.line（外框 lineStrong、控制項 lineControl）',
    // 同一行內往後找（允許中間有 `${…}`、三元式）；`\b` 已排除 lineStrong／lineControl／lineSection。跨多行的值抓不到（已知限制）。
    // 值結束於下一個「, 屬性名:」：`border: 'none', borderBottom: …T.line` 是單邊分隔線，不可算進來（2026-10-08 誤報 6 處）
    // 分隔線色的別名一律命名為 `*.divider`（報表／服務目錄的 C.divider＝T.line），拿它畫外框一樣是淡框——
    // 用命名約定涵蓋所有別名，不在規則裡逐一列名（2026-10-08 第二輪 review）。
    // 也抓指派寫法 `style.borderColor = …`（hover 還原常見）。
    scan: src => [...src.matchAll(/(?:\b(?:border|borderColor)\s*:|\.borderColor\s*=(?!=))(?:[^\n,;]|,(?!\s*[A-Za-z]+\s*:))*?(?:\bT\.line\b|\.divider\b)/g)] },
  // 2026-10-08（DECISIONS mockup 109）：手刻標籤——小 padding＋圓角＋底色或框＋caption／meta 字級的 span／div。
  // 全站一度有 47 處各刻各的（灰底在 hover 列上消失、同一個「已停用」有灰有黃）；狀態用 Badge、屬性用 Chip。
  // 看整個 style 物件（可跨多行），以括號配對找結尾。不是標籤的（數值、產品標記、計數徽章）寫 audit-ok。
  { id: 'handTag', desc: '手刻標籤（狀態用 <Badge>、屬性用 <Chip>）',
    scan: (src, file) => TAG_OWNERS.includes(file) ? [] : [...src.matchAll(/<(?:span|div)\b[^>]*?style=\{\{/g)].filter(m => {
      let i = m.index + m[0].length, d = 2
      while (d > 0 && i < src.length) { const c = src[i++]; if (c === '{') d++; else if (c === '}') d-- }
      const st = src.slice(m.index, i)
      return /padding:\s*'[0-4]px \d+px'/.test(st) && /borderRadius/.test(st) && /\b(background|border):/.test(st)
        && /fontSize:\s*T\.fontSize\.(caption|meta)\b/.test(st)
    }) },
  // 2026-11-04（DECISIONS mockup 120）：數字框的錯誤紅框一律用 `error`，不在 style 裡自己切紅色。
  // 原本 6 處各自畫、用了 base／dark／text 三種紅；NumberInput 內建 error 後統一。看整個 <NumberInput …/> 標籤（以大括號配對找結尾），
  // 每個 T.state.danger 往前找最近的「屬性名:」——只認緊接在 `{` 或 `,`（可隔空白／換行）之後的，三元式 `ok ? base : x` 的 base 不算（第四輪 review），
  // 是 border*／outline*／boxShadow 就算——跨行、包在函式或樣板字串裡都抓得到；紅色文字（color）、底色不算。
  // 已知限制：style 由標籤外的變數組出來時抓不到（閘門擋的是順手寫錯，刻意繞過歸 code review）；大括號內字串含 { } 會影響配對。
  { id: 'numberErrorBorder', desc: '數字框自己畫錯誤紅框（請用 <NumberInput error>）',
    scan: src => [...src.matchAll(/<NumberInput\b/g)].filter(m => {
      let i = m.index + m[0].length, d = 0
      while (i < src.length) {
        const c = src[i++]
        if (c === '{') d++
        else if (c === '}') d--
        else if (d === 0 && c === '/' && src[i] === '>') break
      }
      const tag = src.slice(m.index, i)
      return [...tag.matchAll(/T\.state\.danger\b/g)].some(d => {
        const keys = [...tag.slice(0, d.index).matchAll(/[{,]\s*([A-Za-z]+)\s*:(?!:)/g)]
        const key = keys.length ? keys[keys.length - 1][1] : ''
        return /^(border|outline|boxShadow)/.test(key)
      })
    }) },
  { id: 'staticTheme', desc: '靜態 import { T }（多品牌主題會失效，請用 useTheme()）',
    scan: src => [...src.matchAll(/^import \{ T \} from/gm)] },
  ]
}

// JSX 開頭標籤（到深度 0 的 `>` 為止）。大括號內的 `>`、`=>` 不算；字串（屬性值 "…"、大括號內的 '…' "…" `…`）
// 整段跳過，字串裡的 `>`、`{`、`}` 不影響配對（補審：`label="金額 > 0"`、`helper={'用 { 括住'}` 原本會切錯）。
// 已知限制：樣板字串的 `${…}` 不另外配對（整段當字串跳過）；大括號內 JSX 文字裡的單引號（it's）會被當成字串開頭。
export function jsxOpenTag(src, at) {
  let d = 0
  for (let i = at + 1; i < src.length; i++) {
    const c = src[i]
    if (c === '"' || c === "'" || c === '`') {
      if (d === 0 && c !== '"' && c !== "'") continue
      const end = src.indexOf(c, i + 1)
      if (end < 0) return src.slice(at)
      i = end
    } else if (c === '{') d++
    else if (c === '}') d--
    else if (c === '>' && d === 0) return src.slice(at, i + 1)
  }
  return src.slice(at)
}
// 以整個開頭標籤當比對結果：audit-ok 寫在多行標籤裡任何一行都認（補審）
const tagMatch = (src, at) => Object.assign([jsxOpenTag(src, at)], { index: at })

// 註解換成等長空白再掃（不刪除，行號才不會偏）
export function stripComments(src) {
  const pad = m => m.replace(/[^\n]/g, ' ')
  return src.replace(/\/\*[\s\S]*?\*\//g, pad).replace(/(^|[^:])\/\/[^\n]*/g, (m, p1) => p1 + pad(m.slice(p1.length)))
}

export function scan(file, src, rules) {
  if (!Array.isArray(rules)) throw new Error('aw-kit/gates/style-gate：scan 需要 rules（createStyleRules(...) 的結果）')
  const code = stripComments(src)
  const lines = src.split('\n')
  const lineOf = at => code.slice(0, at).split('\n').length
  // 比對起點的上一行到下兩行（沿用）；多行比對（整個開頭標籤）延伸到結尾的下一行
  const exempt = (n, last, id) => lines.slice(Math.max(0, n - 2), Math.max(n + 2, last + 1)).some(l => l.includes(`audit-ok: ${id}`))
  const hits = []
  for (const r of rules) for (const m of r.scan(code, file)) {
    const n = lineOf(m.index)
    if (!exempt(n, Math.max(n, lineOf(m.index + m[0].length)), r.id)) hits.push({ file, line: n, rule: r.id, text: m[0].trim().slice(0, 40) })
  }
  return hits
}
