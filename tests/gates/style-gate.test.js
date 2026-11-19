// @vitest-environment node
// style-gate 的正反對照：每條規則各一個會亮、一個不該亮的樣本。2026-11-19 自 inknock tests/check-style.test.ts 搬入（ADR 0002 E 批），案例不變。
// 設定照消費端（inknock）的形狀組：aw-kit/ui 以 `aw-kit/src/ui/` 標籤、消費端自己的元件層在 src/shared/ui、標籤元件另有 badge、色票＝aw-kit 共用層＋品牌層。
import { readFileSync } from 'node:fs'
import { describe, it, expect } from 'vitest'
import { createStyleRules, readPalette, scan, uiOwners } from '../../src/gates/style-gate.js'

// 品牌層的 theme.ts（夾具）：SERIES 的分類色不算合法色
const BRAND_THEME = "export const NEUTRAL = { inkFaint: '#8A8A8A' }\nexport const SERIES = {\n  blue: '#2563EB', brown: '#9B6D46',\n} as const\n"
const KIT = uiOwners('aw-kit/src/ui/')
const RULES = createStyleRules({
  palette: readPalette([readFileSync(new URL('../../src/ui/theme.ts', import.meta.url), 'utf8'), BRAND_THEME]),
  owners: KIT.owners,
  tagOwners: ['src/shared/ui/badge.tsx', ...KIT.tagOwners],
  isComponentLayer: f => f.startsWith('src/shared/ui/') || f.startsWith('aw-kit/src/ui/'),
  paletteSkip: ['src/shared/theme.ts', ...KIT.paletteSkip],
})
const rules = (src, file = 'src/features/x.tsx') => scan(file, src, RULES).map(h => h.rule)

describe('check:style', () => {
  it('readPalette：每一份來源的 SERIES 都剝掉（不只第一份）', () => {
    const p = readPalette(["export const SERIES = {\n  a: '#111111',\n} as const\n", "export const SERIES = {\n  b: '#222222',\n} as const\nexport const X = '#333333'\n"])
    expect([...p]).toEqual(['#333333'])
  })
  it('色票外的顏色亮；色票內、白色、註解裡的不亮', () => {
    expect(rules(`const c = '#123456'`)).toEqual(['palette'])
    expect(rules(`const c = '#FFFFFF'`)).toEqual([])
    expect(rules(`// 例：Shopify 的 #123456`)).toEqual([])
  })
  it('裸控制項：一般檔案亮，擁有它的元件檔不亮', () => {
    expect(rules(`<button onClick={f}>x</button>`)).toEqual(['bareControl'])
    expect(rules(`<button onClick={f}>x</button>`, 'aw-kit/src/ui/icon-button.tsx')).toEqual([])
    // 搬進 aw-kit 後，消費端舊路徑不再是擁有者
    expect(rules(`<button onClick={f}>x</button>`, 'src/shared/ui/icon-button.tsx')).toEqual(['bareControl'])
    expect(rules(`<button onClick={f}>x</button>`, 'aw-kit/src/ui/button.tsx')).toEqual([])
  })
  it('裸 input：radio／file／hidden 不亮，其餘（含 checkbox，2026-11-15 起有共用 Checkbox）照亮', () => {
    for (const t of ['radio', 'file', 'hidden']) expect(rules(`<input type="${t}" onChange={e => f(e)} />`)).toEqual([])
    expect(rules(`<input type="checkbox" onChange={e => f(e)} />`)).toEqual(['bareControl'])
    expect(rules(`<input type="checkbox" />`, 'aw-kit/src/ui/checkbox.tsx')).toEqual([])
    expect(rules(`<button role="switch" />`, 'aw-kit/src/ui/switch.tsx')).toEqual([])
    expect(rules(`<button role="tab" />`, 'aw-kit/src/ui/tabs.tsx')).toEqual([])
    expect(rules(`<input type="text" onChange={e => f(e)} />`)).toEqual(['bareControl'])
    expect(rules(`<input type="date" />`)).toEqual(['bareControl'])
    expect(rules(`<input value={v} />`)).toEqual(['bareControl'])
    // type 屬於下一個元素時不可被借用：第一個 input 仍要亮
    expect(rules(`<input value={v} />\n<input type="radio" />`)).toEqual(['bareControl'])
    // 自閉合不留空白（`<input/>`）也要亮（2026-11-14 補審：原本只認空白或 `>`）
    expect(rules(`<input/>`)).toEqual(['bareControl'])
    expect(rules(`<textarea/>`)).toEqual(['bareControl'])
    expect(rules(`<input type="radio"/>`)).toEqual([])
    expect(rules(`<input type="checkbox"/>`)).toEqual(['bareControl'])
  })
  it('分類色 SERIES 的 hex 寫在頁面上仍亮；theme.ts 本身不掃（2026-09-30）', () => {
    expect(rules(`const c = '#2563EB'`)).toEqual(['palette'])
    expect(rules(`const c = '#9B6D46'`)).toEqual(['palette'])
    expect(rules(`const c = '#2563EB'`, 'src/shared/theme.ts')).toEqual([])
    // uiOwners() 也帶上 aw-kit/ui 的 theme.ts（消費端與 aw-kit 自掃同一判準）
    expect(KIT.paletteSkip).toEqual(['aw-kit/src/ui/theme.ts'])
    expect(rules(`const c = '#2563EB'`, 'aw-kit/src/ui/theme.ts')).toEqual([])
  })
  it('數字框自己畫紅框亮；用 error、警示黃框、其他元素的紅不亮（2026-11-04 mockup 120）', () => {
    expect(rules(`<NumberInput value={v} onChange={f} style={{ borderColor: bad ? T.state.danger.base : T.lineControl }} />`)).toEqual(['numberErrorBorder'])
    // 跨多行、箭頭函式裡有 `>` 也要找到標籤結尾
    expect(rules(`<NumberInput value={v}\n  onChange={v => set(v)}\n  style={{ ...s, border: \`1px solid \${bad ? T.state.danger.text : T.lineControl}\` }} />`)).toEqual(['numberErrorBorder'])
    expect(rules(`<NumberInput value={v} onChange={f} error={bad} style={s} />`)).toEqual([])
    expect(rules(`<NumberInput value={v} onChange={f} style={{ borderColor: z ? T.state.warning.base : T.lineControl }} />`)).toEqual([])
    // 紅色文字（負數）不是框線，不亮
    expect(rules(`<NumberInput value={v} onChange={f} style={{ color: neg ? T.state.danger.text : T.ink }} />`)).toEqual([])
    // 單邊框線也算
    expect(rules(`<NumberInput value={v} onChange={f} style={{ borderBottomColor: bad ? T.state.danger.base : T.line }} />`)).toEqual(['numberErrorBorder'])
    // 第三輪 review 列出的漏網寫法：跨行、包在函式裡、樣板字串含 ${w}、boxShadow／outline 紅圈
    expect(rules(`<NumberInput value={v} onChange={f} style={{ borderColor: bad\n  ? T.state.danger.base : T.lineControl }} />`)).toEqual(['numberErrorBorder'])
    expect(rules(`<NumberInput value={v} onChange={f} style={{ borderColor: pick(bad, T.state.danger.base) }} />`)).toEqual(['numberErrorBorder'])
    expect(rules(`<NumberInput value={v} onChange={f} style={{ border: \`\${w}px solid \${bad ? T.state.danger.base : x}\` }} />`)).toEqual(['numberErrorBorder'])
    expect(rules(`<NumberInput value={v} onChange={f} style={{ boxShadow: \`0 0 0 1px \${T.state.danger.base}\` }} />`)).toEqual(['numberErrorBorder'])
    expect(rules(`<NumberInput value={v} onChange={f} style={{ outline: bad ? \`1px solid \${T.state.danger.base}\` : 'none' }} />`)).toEqual(['numberErrorBorder'])
    // 三元式另一分支是裸變數（`ok ? base : 紅`）時，屬性名仍是 borderColor／boxShadow（第四輪 review）
    expect(rules(`<NumberInput value={v} onChange={f} style={{ borderColor: ok ? base : T.state.danger.base }} />`)).toEqual(['numberErrorBorder'])
    expect(rules(`<NumberInput value={v} onChange={f} style={{ boxShadow: focused ? ring : \`0 0 0 1px \${T.state.danger.base}\` }} />`)).toEqual(['numberErrorBorder'])
    // 三元式的冒號不可被當成屬性名：color 的值裡 `x ? a : T.state.danger` 仍算文字色
    expect(rules(`<NumberInput value={v} onChange={f} style={{ color: ok ? T.ink : T.state.danger.text }} />`)).toEqual([])
    // 紅色在下一個元素上，不可被算到數字框頭上
    expect(rules(`<NumberInput value={v} onChange={f} />\n<span style={{ color: T.state.danger.base }}>x</span>`)).toEqual([])
  })
  it('label 缺 htmlFor 亮、有則不亮', () => {
    expect(rules(`<label>名稱</label>`)).toEqual(['labelFor'])
    expect(rules(`<label htmlFor="n">名稱</label><Input id="n" />`)).toEqual([])
  })
  it('柔邊陰影、主色當文字、靜態 T 各自會亮', () => {
    expect(rules(`const s = { boxShadow: '0 4px 12px rgba(0,0,0,.1)' }`)).toEqual(['softShadow'])
    expect(rules(`const s = { color: T.accent600 }`)).toEqual(['accentAsText'])
    expect(rules(`import { T } from '@/src/shared/theme'`)).toEqual(['staticTheme'])
  })
  it('淡框：border／borderColor 用 T.line 亮；單邊分隔線、lineStrong／lineControl／lineSection、audit-ok 不亮（2026-10-07）', () => {
    expect(rules('const s = { border: `1px solid ${T.line}` }')).toEqual(['faintBorder'])
    expect(rules(`const s = { borderColor: T.line }`)).toEqual(['faintBorder'])
    expect(rules('const s = { border: `1px solid ${on ? T.accent600 : T.line}` }')).toEqual(['faintBorder'])
    // 前面有 ${…} 或三元式兩支都是樣板字串時也要抓到（2026-10-08 code review）
    expect(rules('const s = { border: `${w}px solid ${T.line}` }')).toEqual(['faintBorder'])
    expect(rules('const s = { border: on ? `2px solid ${T.accent600}` : `1px solid ${T.line}` }')).toEqual(['faintBorder'])
    expect(rules('const s = { borderBottom: `1px solid ${T.line}` }')).toEqual([])
    // 別名 C.border（＝T.line）畫外框也要抓；當分隔線用則不算
    expect(rules('const s = { border: `1px solid ${C.divider}` }')).toEqual(['faintBorder'])
    expect(rules('const s = { border: `1px solid ${P.divider}` }')).toEqual(['faintBorder'])
    expect(rules('const s = { borderBottom: `1px solid ${C.divider}` }')).toEqual([])
    // 指派寫法（hover 還原）也要抓
    expect(rules('e.currentTarget.style.borderColor = T.line')).toEqual(['faintBorder'])
    expect(rules('e.currentTarget.style.borderColor = T.lineControl')).toEqual([])
    // 名叫 borderColor 的區域變數不是 style 屬性（BookingReviewPage 的左側色條顏色）
    expect(rules('const borderColor = cfg ? x : T.line')).toEqual([])
    // 同一行先寫 border: 'none' 再寫單邊分隔線：不是外框（2026-10-08 誤報）
    expect(rules("const s = { border: 'none', borderBottom: `1px solid ${T.line}` }")).toEqual([])
    expect(rules('const s = { borderTop: `1px solid ${T.line}` }')).toEqual([])
    for (const t of ['lineStrong', 'lineControl', 'lineSection']) expect(rules(`const s = { border: \`1px solid \${T.${t}}\` }`)).toEqual([])
    expect(rules('// audit-ok: faintBorder — 頭像描邊\nconst s = { border: `1px solid ${T.line}` }')).toEqual([])
  })
  it('兩套工具同時要例外時，audit-ok 寫在 eslint-disable 的理由段也認（2026-10-01）', () => {
    expect(rules(`{/* eslint-disable-next-line aw-kit/no-hardcoded-design-token -- ✕ 字元；audit-ok: bareControl — 無邊框 */}\n<button>✕</button>`)).toEqual([])
    expect(rules(`{/* eslint-disable-next-line aw-kit/no-hardcoded-design-token -- ✕ 字元 */}\n<button>✕</button>`)).toEqual(['bareControl'])
  })
  it('audit-ok 要寫對規則名才認', () => {
    expect(rules(`// audit-ok: bareControl — 分段控制項\n<button>x</button>`)).toEqual([])
    expect(rules(`// audit-ok: palette — 寫錯規則\n<button>x</button>`)).toEqual(['bareControl'])
  })
  it('手刻標籤：亮；共用元件檔、一般容器、例外標記不亮（2026-10-08 handTag）', () => {
    const tag = "<span style={{ fontSize: T.fontSize.caption, background: T.neutralSunken, padding: '2px 8px', borderRadius: T.radius.xs }}>x</span>"
    expect(rules(tag)).toEqual(['handTag'])
    // 跨多行的 style 物件也要抓到（舊的單行 grep 漏掉的形狀）
    expect(rules("<span style={{\n  fontSize: T.fontSize.meta,\n  border: `1px solid ${T.lineControl}`,\n  padding: '1px 6px', borderRadius: T.radius.sm,\n}}>x</span>")).toEqual(['handTag'])
    expect(rules(tag, 'aw-kit/src/ui/chip.tsx')).toEqual([])
    expect(rules(tag, 'src/shared/ui/chip.tsx')).toEqual(['handTag'])
    expect(rules(tag, 'src/shared/ui/badge.tsx')).toEqual([])
    // 卡片、按鈕列等大 padding 容器不算
    expect(rules("<div style={{ fontSize: T.fontSize.meta, background: T.surface, padding: '12px 16px', borderRadius: T.radius.md }}>x</div>")).toEqual([])
    // 沒有底色也沒有框的純文字不算
    expect(rules("<span style={{ fontSize: T.fontSize.caption, padding: '2px 8px', borderRadius: T.radius.xs }}>x</span>")).toEqual([])
    expect(rules(tag.replace('<span', '<span /* audit-ok: handTag — 數值 */'))).toEqual([])
  })
  it('FormField 有標籤沒對欄位亮；htmlFor、group、沒有 label 不亮（2026-11-16 第 13 批 review）', () => {
    expect(rules(`<FormField label="姓名" required><Input value={v} /></FormField>`)).toEqual(['fieldLabelFor'])
    expect(rules(`<FormField label="姓名" htmlFor="n"><Input id="n" /></FormField>`)).toEqual([])
    expect(rules(`<FormField label="開始時間" group><TimeSelect /></FormField>`)).toEqual([])
    expect(rules(`<FormField helper="x"><Input /></FormField>`)).toEqual([])
    // 跨行、labelAction 裡有 JSX 與箭頭函式的 `>`：要找到真正的標籤結尾
    expect(rules(`<FormField\n  label="地址"\n  labelAction={<a onClick={() => go()}>地圖</a>}\n>\n<Input /></FormField>`)).toEqual(['fieldLabelFor'])
    expect(rules(`<FormField\n  label="地址"\n  labelAction={<a onClick={() => go()}>地圖</a>}\n  htmlFor="addr"\n><Input id="addr" />`)).toEqual([])
    // htmlFor／group 只出現在標籤之後的子元素裡不算
    expect(rules(`<FormField label="x"><Child htmlFor="y" group /></FormField>`)).toEqual(['fieldLabelFor'])
    // 「groupId」之類的屬性名不算 group
    expect(rules(`<FormField label="x" groupId="a">`)).toEqual(['fieldLabelFor'])
    // 補審：group 只認不帶值的寫法（group={cond} 為假時就是沒對到欄位的 label）
    expect(rules(`<FormField label="x" group={isMulti}><Input /></FormField>`)).toEqual(['fieldLabelFor'])
    // 補審：字串裡的 > 與 { } 不影響找標籤結尾
    expect(rules(`<FormField label="金額 > 0" htmlFor="amt"><Input id="amt" />`)).toEqual([])
    expect(rules(`<FormField label="x" helper={'用 { 括住'}>\n<Input /></FormField>\n<label htmlFor="other">y</label><Input id="other" />`)).toEqual(["fieldLabelFor"])
    expect(rules(`<FormField label="x" helper={\`說明 }\`} htmlFor="a"><Input id="a" />`)).toEqual([])
    // 補審：多行標籤裡任何一行的 audit-ok 都認；起點上一行照舊認
    expect(rules(`<FormField\n  label="x"\n  labelAction={<b />}\n  // audit-ok: fieldLabelFor — 理由\n>`)).toEqual([])
    expect(rules(`// audit-ok: fieldLabelFor — 理由\n<FormField label="x">`)).toEqual([])
  })
  it('htmlFor 在同檔找不到同值的 id 亮：打錯字、漏給 id（第 16 批 review）；對得上、audit-ok 不亮', () => {
    expect(rules('<FormField label="x" htmlFor={`${fid}-nmae`}><Input id={`${fid}-name`} /></FormField>')).toEqual(['labelTarget'])
    expect(rules('<FormField label="x" htmlFor={`${fid}-name`}><Input /></FormField>')).toEqual(['labelTarget'])
    expect(rules('<label htmlFor="d">x</label><Input id="e" />')).toEqual(['labelTarget'])
    expect(rules('<FormField label="x" htmlFor={`${fid}-name`}><Input id={`${fid}-name`} /></FormField>')).toEqual([])
    expect(rules('<label htmlFor="d">x</label><Input id="d" />')).toEqual([])
    expect(rules("<FormField label=\"x\" htmlFor={fieldId('city')}><Select id={fieldId('city')} /></FormField>")).toEqual([])
    expect(rules('// audit-ok: labelTarget — id 由呼叫端傳入\n<label htmlFor={id}>x</label>')).toEqual([])
    // 補審：同檔兩個元件用同名 id，其中一個漏給 → 以次數比對抓得到
    expect(rules('<FormField label="a" htmlFor={`${fid}-ig`}><Input /></FormField>\n<FormField label="b" htmlFor={`${fid}-ig`}><Input id={`${fid}-ig`} /></FormField>')).toEqual(['labelTarget'])
    expect(rules('<FormField label="a" htmlFor={`${fid}-ig`}><Input id={`${fid}-ig`} /></FormField>\n<FormField label="b" htmlFor={`${fid}-ig`}><Input id={`${fid}-ig`} /></FormField>')).toEqual([])
    // data-testid= 不算 id；單引號、大括號內空白視同
    expect(rules('<label htmlFor="a">x</label><Input data-testid="a" />')).toEqual(['labelTarget'])
    expect(rules("<label htmlFor='a'>x</label><Input />")).toEqual(['labelTarget'])
    expect(rules("<label htmlFor='a'>x</label><Input id=\"a\" />")).toEqual([])
    expect(rules('<FormField label="x" htmlFor={ `${fid}-a` }><Input id={`${fid}-a`} /></FormField>')).toEqual([])
  })
  it('可點的 div／span／li 沒有 role 亮；有 role、Pressable、shared/ui、audit-ok 不亮（2026-11-17 第 20 批）', () => {
    expect(rules('<div onClick={() => open(x)} style={s}>列</div>')).toEqual(['clickDiv'])
    expect(rules('<li\n  key={k}\n  onClick={go}\n>x</li>')).toEqual(['clickDiv'])
    expect(rules('<span onClick={go}>x</span>')).toEqual(['clickDiv'])
    expect(rules('<div role="button" tabIndex={0} onClick={go} onKeyDown={k}>x</div>')).toEqual([])
    // 補審：tabIndex={-1} 到不了、沒有按鍵處理按了沒反應
    expect(rules('<div role="button" tabIndex={-1} onClick={go} onKeyDown={k}>x</div>')).toEqual(['clickDiv'])
    expect(rules('<div role="button" tabIndex={0} onClick={go}>x</div>')).toEqual(['clickDiv'])
    expect(rules('<Pressable onPress={go}>x</Pressable>')).toEqual([])
    expect(rules('<div onClick={close}>x</div>', 'aw-kit/src/ui/modal.tsx')).toEqual([])
    expect(rules('<div /* audit-ok: clickDiv — 遮罩 */ onClick={close}>x</div>')).toEqual([])
    // 補審：只有 role 不夠——非互動角色、條件式 role、沒有 tabIndex 都要亮
    expect(rules('<div role="button" onClick={go}>x</div>')).toEqual(['clickDiv'])
    expect(rules('<div role="row" tabIndex={0} onClick={go} onKeyDown={k}>x</div>')).toEqual(['clickDiv'])
    expect(rules("<span role={pick ? 'button' : undefined} tabIndex={0} onClick={go}>x</span>")).toEqual(['clickDiv'])
    // onClick 寫在子元素、不在這個標籤上不算
    expect(rules('<div style={s}><Button onClick={go}>x</Button></div>')).toEqual([])
  })
  it('頁面上自己寫字級的 <label> 亮；src/shared/ui、沒寫字級、audit-ok 不亮', () => {
    expect(rules(`<label htmlFor="d" style={{ fontSize: T.fontSize.body, color: T.inkMuted }}>日期</label><Input id="d" />`)).toEqual(['handLabel'])
    expect(rules(`<label\n  htmlFor="d"\n  style={{\n    fontSize: T.fontSize.body,\n  }}>日期</label><Input id="d" />`)).toEqual(['handLabel'])
    expect(rules(`<label htmlFor="d" style={{ fontSize: 12 }}>x</label><Input id="d" />`, 'aw-kit/src/ui/form-field.tsx')).toEqual([])
    expect(rules(`<label htmlFor="d" style={SR_ONLY}>x</label><Input id="d" />`)).toEqual([])
    expect(rules(`<label htmlFor="d" style={{ display: 'flex' }}>x</label><Input id="d" />`)).toEqual([])
    expect(rules(`{/* audit-ok: handLabel — 勾選框旁的選項文字 */}\n<label htmlFor="d" style={{ fontSize: T.fontSize.body }}>x</label><Input id="d" />`)).toEqual([])
    // 多行 label：audit-ok 寫在 fontSize 那行也認（補審）
    expect(rules(`<label\n  htmlFor="d"\n  style={{\n    fontSize: T.fontSize.body, // audit-ok: handLabel — 選項文字\n  }}>x</label><Input id="d" />`)).toEqual([])
  })
})
