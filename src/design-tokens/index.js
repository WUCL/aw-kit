// aw-kit/design-tokens：DESIGN.md 代幣產生器（inknock ADR 0002〈二〉〈四〉，2026-11-19 自 inknock scripts/gen-design-tokens.mjs 搬入）。
//
// 分層：
// - BASE（本檔）＝共用層：狀態色、字級（不含字體）、圓角、陰影、間距階梯與 gap／pad 別名、控制項高度、列高。
//   只能在 aw-kit 改；與 src/ui/theme.ts 的 TS 常數一致由 tests/design-tokens 驗。
// - 專案 DESIGN.md 的 frontmatter＝品牌層：colors（名稱＝BRAND_COLOR_NAMES，不多不少）＋ font-family。
//   寫了共用層的鍵、多一個或少一個品牌色名稱，一律報錯（ADR：名稱固定、只准填值、共用層不准覆寫）。
// - mergeDesign() 把兩層合成「完整 frontmatter」（形狀與拆分前的 inknock DESIGN.md 相同），render() 只吃合成後的結果。
//
// 產出什麼、為什麼（照搬 inknock 原說明）：
// - 顏色：值寫在 :root 的 --ds-*，@theme inline 只引用 var()——執行期換品牌色只需 setProperty。
//   先 `--color-*: initial` 移除 Tailwind 內建色階（red-500 之類編不出來），只補回 black／white。
// - 字級：先 `--text-*: initial`，只產生 8 級（text-caption…text-kpi，含行高、字距）。
//   字重不併進字級：中文字重上限 600 由元件決定，併進去會與 font-* class 搶順序。
// - 間距：只產生情境別名 gap／pad（The Alias-Not-Ladder Rule：頁面只用這一層）。
//   不產生 t-shirt 階梯名（p-sm 之類）——那會多一種寫法；數字刻度（p-4）保留給元件。
// - 圓角：用 `@theme static`（不是 inline）：值要以 CSS 變數存在，shadcn 元件有 `calc(var(--radius-…))` 的寫法；
//   先 `--radius-*: initial`，Tailwind 內建的 2xl／3xl／4xl 編不出來（少一種刻度）。pill 不產生：膠囊一律用 rounded-full。
// - 控制項高度：:root 的 --control-h-sm／md／lg，元件以 h-(--control-h-md) 引用。版面列高同理：--row-h-nav／touch。
// - 陰影：只產生 shadcn 沒有對應的 knob（開關圓鈕）。
//
// 純函式、不做檔案 I/O（讀檔與寫檔由專案的包裝腳本負責）。不依賴 YAML 套件：解析 frontmatter 的函式由呼叫端傳入
// （例 `readDesign(md, yaml.load)`）——import 本模組不需要任何額外安裝。

/**
 * 共用層。gap／pad 的 "{spacing.xs}" 是引用，render 時解析。
 * colors 是狀態色：DESIGN.md 名稱與 src/ui/theme.ts 位置不同（amber-bg＝STATE.warning.bg、hover-surface＝INTERACTION.hoverSurface…），
 * 對照表在 tests/design-tokens/design-tokens.test.js 的 STATE_COLOR。
 */
export const BASE = {
  colors: {
    "amber-bg": "#FEF3C7",
    "amber-ink": "#92400E",
    "amber-border": "#FDE68A",
    "amber-dark": "#B45309",
    "danger-bg": "#FEE2E2",
    "danger-ink": "#7F1D1D",
    "danger-base": "#EF4444",
    "danger-dark": "#DC2626",
    "marker-ink": "#9A3412",
    "marker-border": "#FDBA74",
    "neutral-bg": "#F4F5F6",
    "neutral-ink": "#374151",
    "hover-surface": "rgba(20,24,28,0.04)"
  },
  typography: {
    caption: {
      fontSize: "12px",
      fontWeight: 500,
      lineHeight: 1.4
    },
    meta: {
      fontSize: "13px",
      fontWeight: 500,
      lineHeight: 1.4
    },
    body: {
      fontSize: "15px",
      fontWeight: 400,
      lineHeight: 1.6
    },
    "body-lg": {
      fontSize: "17px",
      fontWeight: 500,
      lineHeight: 1.6
    },
    title: {
      fontSize: "20px",
      fontWeight: 600,
      lineHeight: 1.35
    },
    "page-title": {
      fontSize: "24px",
      fontWeight: 600,
      lineHeight: 1.3
    },
    amount: {
      fontSize: "30px",
      fontWeight: 700,
      lineHeight: 1.2,
      letterSpacing: "-0.02em"
    },
    kpi: {
      fontSize: "38px",
      fontWeight: 700,
      lineHeight: 1.1,
      letterSpacing: "-0.03em"
    }
  },
  rounded: {
    xs: "4px",
    sm: "6px",
    md: "8px",
    lg: "10px",
    xl: "12px",
    pill: "9999px"
  },
  shadow: {
    none: "none",
    card: "none",
    navActive: "0 1px 0 0 rgba(26,26,26,0.07)",
    raised: "0 1px 2px rgba(20,24,28,0.10), 0 0 0 1px rgba(20,24,28,0.04)",
    menu: "0 4px 16px rgba(20,24,28,0.10)",
    panel: "-8px 0 32px rgba(20,24,28,0.10)",
    panelTop: "0 -8px 32px rgba(20,24,28,0.10)",
    modal: "0 20px 60px rgba(20,24,28,0.18)",
    knob: "0 1px 3px rgba(20,24,28,0.20)"
  },
  spacing: {
    "2xs": "2px",
    xs: "4px",
    sm: "8px",
    md: "12px",
    lg: "16px",
    xl: "20px",
    "2xl": "24px",
    "3xl": "32px",
    "4xl": "40px",
    "5xl": "48px"
  },
  gap: {
    hairline: "{spacing.xs}",
    icon: "{spacing.sm}",
    inline: "{spacing.sm}",
    stack: "{spacing.md}",
    field: "{spacing.lg}",
    block: "{spacing.2xl}",
    section: "{spacing.3xl}"
  },
  pad: {
    control: "{spacing.sm}",
    "row-y": "10px",
    "input-y": "{spacing.md}",
    "input-x": "{spacing.lg}",
    card: "{spacing.xl}",
    panel: "{spacing.2xl}",
    "panel-mobile": "{spacing.lg}",
    page: "{spacing.2xl}"
  },
  "control-height": {
    sm: "28px",
    md: "32px",
    lg: "36px"
  },
  "row-height": {
    nav: "36px",
    touch: "44px"
  }
}

/**
 * 全部顏色名稱的輸出順序（theme.css 依此順序產生）。品牌色＝不在 BASE.colors 的那些。
 * 順序沿用拆分前 inknock DESIGN.md 的順序，讓 inknock 的 theme.css 逐位元組不變。
 */
export const COLOR_ORDER = ["accent-50","accent-100","link","accent-200","accent-300","accent-400","accent-500","accent-600","accent-700","accent-800","secondary-50","secondary-100","secondary-200","secondary-300","secondary-400","secondary-500","secondary-600","secondary-700","secondary-800","surface","canvas","surface-sunken","neutral-sunken","nav-bg","line","line-strong","line-section","line-control","ink","ink-muted","ink-faint","nav-fg","nav-bg-hover","nav-active-bg","ink-surface","ink-surface-hover","table-header-bg","amber-bg","amber-ink","amber-border","amber-dark","danger-bg","danger-ink","danger-base","danger-dark","marker-ink","marker-border","neutral-bg","neutral-ink","hover-surface","avatar-terracotta","avatar-brass","avatar-celadon","avatar-indigo","avatar-plum"]

export const BRAND_COLOR_NAMES = COLOR_ORDER.filter(k => !(k in BASE.colors))

/** 專案 frontmatter 准許的頂層鍵：版本與說明、品牌層、元件定義（Stitch 規範的文件用途，產生器不讀） */
const BRAND_KEYS = ['version', 'name', 'description', 'colors', 'font-family', 'components']

/** DESIGN.md 原文 → frontmatter 的 YAML 文字 */
export function extractFrontmatter(md) {
  const m = md.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/)
  if (!m) throw new Error('DESIGN.md 沒有 frontmatter')
  return m[1]
}

/** DESIGN.md 原文 → 解析後的 frontmatter。parse：YAML 解析函式（js-yaml 的 load） */
export function readFrontmatter(md, parse) {
  if (typeof parse !== 'function') throw new Error('readFrontmatter 需要 YAML 解析函式（例：js-yaml 的 load）')
  return parse(extractFrontmatter(md))
}

/** 專案 frontmatter（品牌層）＋ BASE → 完整 frontmatter。不合規一次列出全部問題。 */
export function mergeDesign(brand) {
  const problems = []
  const shared = Object.keys(BASE)
  for (const k of Object.keys(brand ?? {})) {
    if (BRAND_KEYS.includes(k)) continue
    problems.push(shared.includes(k)
      ? `「${k}」是共用層，只能在 aw-kit 改（專案 DESIGN.md 只填品牌層：colors、font-family）`
      : `不認得的鍵「${k}」`)
  }
  const rawColors = brand?.colors
  const colorsOk = rawColors !== null && typeof rawColors === 'object' && !Array.isArray(rawColors)
  if (rawColors !== undefined && !colorsOk) problems.push('colors 必須是「名稱: 色值」的對照表')
  const colors = colorsOk ? rawColors : {}
  const missing = BRAND_COLOR_NAMES.filter(k => !(k in colors))
  const extra = Object.keys(colors).filter(k => !BRAND_COLOR_NAMES.includes(k))
  if (missing.length) problems.push(`缺少品牌色：${missing.join('、')}`)
  for (const k of extra) problems.push(k in BASE.colors ? `「colors.${k}」是共用層狀態色，只能在 aw-kit 改` : `不認得的品牌色名稱「${k}」（名稱由 aw-kit 定義，只准填值）`)
  for (const k of BRAND_COLOR_NAMES) if (k in colors && (typeof colors[k] !== 'string' || !colors[k].trim())) problems.push(`品牌色「${k}」沒有值`)
  const font = brand?.['font-family']
  if (typeof font !== 'string' || !font.trim()) problems.push('缺少 font-family')
  if (problems.length) throw new Error(`DESIGN.md 品牌層不合規：\n- ${problems.join('\n- ')}`)

  const { colors: baseColors, typography, ...rest } = BASE
  const merged = {
    ...(brand.version !== undefined && { version: brand.version }),
    ...(brand.name !== undefined && { name: brand.name }),
    ...(brand.description !== undefined && { description: brand.description }),
    colors: Object.fromEntries(COLOR_ORDER.map(k => [k, k in baseColors ? baseColors[k] : colors[k]])),
    typography: Object.fromEntries(Object.entries(typography).map(([k, t]) => [k, { fontFamily: font, ...t }])),
    ...structuredClone(rest),
    ...(brand.components !== undefined && { components: brand.components }),
  }
  // components（Stitch 規範的元件定義，產生器不讀）引用共用層與品牌層的代幣：合成後每個引用都要解析得到，
  // 否則專案 DESIGN.md 單獨看是懸空引用、打錯字也沒人發現
  const bad = []
  // 字串裡每一個 {…} 都檢查（含嵌在長值裡的 "1px solid {colors.line}"）；只支援 {群組.名稱} 兩段式，其他形狀一律報
  const walk = (v, path) => {
    if (typeof v === 'string') {
      for (const [ref] of v.matchAll(/\{[^{}]*\}/g)) {
        try { if (!/^\{[\w-]+\.[\w-]+\}$/.test(ref)) throw 0; resolveRef(merged, ref) } catch { bad.push(`${path}：${ref}`) }
      }
    } else if (v && typeof v === 'object') for (const [k, x] of Object.entries(v)) walk(x, `${path}.${k}`)
  }
  walk(merged.components, 'components')
  if (bad.length) throw new Error(`DESIGN.md components 引用了不存在的代幣：\n- ${bad.join('\n- ')}`)
  return merged
}

/** 讀專案 DESIGN.md 原文 → 完整 frontmatter。parse：YAML 解析函式 */
export const readDesign = (md, parse) => mergeDesign(readFrontmatter(md, parse))

// "{spacing.2xl}" → 解析成 spacing 裡的值；其他原樣回傳
export function resolveRef(fm, v) {
  const m = typeof v === 'string' && v.match(/^\{([\w-]+)\.([\w-]+)\}$/)
  if (!m) return v
  const group = fm[m[1]]
  // 只認自己的鍵：{colors.constructor}、{rounded.toString} 之類原型鏈上的名稱不算代幣
  const got = group && typeof group === 'object' && Object.prototype.hasOwnProperty.call(group, m[2]) ? group[m[2]] : undefined
  if (got === undefined) throw new Error(`DESIGN.md 引用不存在：${v}`)
  return resolveRef(fm, got)
}

const px = v => (typeof v === 'number' ? `${v}px` : String(v))

// shadcn 元件寫死 text-xs／text-sm／text-base → 對到 DESIGN.md 的角色（元件裡的 text-sm 就是內文 15）。
// 不能用 var() 指過去：@theme inline 不輸出 --text-body 變數。
export const SHADCN_TEXT = { xs: 'caption', sm: 'body', base: 'body' }

// 同一個 Tailwind spacing 命名空間：gap 與 pad 的 key 撞名會靜默互蓋
export function assertNoAliasClash(fm) {
  const dup = Object.keys(fm.gap).filter(k => k in fm.pad)
  if (dup.length) throw new Error(`DESIGN.md 的 gap 與 pad 撞名：${dup.join(', ')}`)
}

// 產生的代幣必須存在：少了不可產生 `--shadow-knob: undefined`（無效 CSS、靜默失效）
function requireToken(fm, group, key) {
  const v = fm[group]?.[key]
  if (typeof v !== 'string' || !v.trim()) throw new Error(`DESIGN.md frontmatter 缺少 ${group}.${key}（需要它產生 --${group}-${key}）`)
  return v
}

const DEFAULT_CSS_HEADER = [
  '/* ⚠️ 產生檔，請勿手改——改 DESIGN.md 的 frontmatter（品牌層）或 aw-kit 的共用層，再重新產生。 */',
]

/** 完整 frontmatter → theme.css 內容。header：檔頭註解行（專案自訂重新產生的指令） */
export function render(fm, { header = DEFAULT_CSS_HEADER } = {}) {
  assertNoAliasClash(fm)
  const colors = Object.entries(fm.colors)
  const font = fm.typography.body.fontFamily.split(',').map(s => s.trim()).map(s => (/\s/.test(s) ? `'${s}'` : s)).join(', ')
  const lines = [
    ...header,
    '',
    ':root {',
    ...colors.map(([k, v]) => `  --ds-${k}: ${v};`),
    ...Object.entries(fm['control-height']).map(([k, v]) => `  --control-h-${k}: ${px(v)};`),
    ...Object.entries(fm['row-height']).map(([k, v]) => `  --row-h-${k}: ${px(v)};`),
    '}',
    '',
    '@theme static {',
    '  --radius-*: initial;',
    ...Object.entries(fm.rounded).filter(([k]) => k !== 'pill').map(([k, v]) => `  --radius-${k}: ${px(v)};`),
    `  --shadow-knob: ${requireToken(fm, 'shadow', 'knob')};`,
    '}',
    '',
    '@theme inline {',
    '  --color-*: initial;',
    '  --color-black: #000;',
    '  --color-white: #fff;',
    ...colors.map(([k]) => `  --color-${k}: var(--ds-${k});`),
    '',
    `  --font-sans: ${font};`,
    '',
    '  --text-*: initial;',
    ...Object.entries(fm.typography).flatMap(([k, t]) => [
      `  --text-${k}: ${px(t.fontSize)};`,
      `  --text-${k}--line-height: ${t.lineHeight};`,
      ...(t.letterSpacing ? [`  --text-${k}--letter-spacing: ${t.letterSpacing};`] : []),
    ]),
    '  /* shadcn 元件內建字級 → DESIGN.md 角色（SHADCN_TEXT） */',
    ...Object.entries(SHADCN_TEXT).flatMap(([k, role]) => {
      const t = fm.typography[role]
      return [`  --text-${k}: ${px(t.fontSize)};`, `  --text-${k}--line-height: ${t.lineHeight};`]
    }),
    '',
    ...['gap', 'pad'].flatMap(group => Object.entries(fm[group]).map(([k, v]) => `  --spacing-${k}: ${px(resolveRef(fm, v))};`)),
    '}',
    '',
  ]
  return lines.join('\n')
}

// cn（tailwind-merge）要知道哪些名稱是字級、哪些是間距，否則 text-meta 會被當顏色、和 text-ink-muted 互相吃掉。
// 只輸出名稱，值仍只在 theme.css。
export function tokenNames(fm) {
  return {
    text: [...Object.keys(fm.typography), ...Object.keys(SHADCN_TEXT)],
    spacing: ['gap', 'pad'].flatMap(g => Object.keys(fm[g])),
    // 產生的陰影名（目前只有 knob）：不讓 cn 認得的話，shadow-knob 會被當成陰影顏色
    shadow: ['knob'],
  }
}

const DEFAULT_NAMES_HEADER = ['// ⚠️ 產生檔，請勿手改——由 aw-kit/design-tokens 產生。']

export function renderNames(fm, { header = DEFAULT_NAMES_HEADER } = {}) {
  const q = a => a.map(x => `'${x}'`).join(', ')
  const { text, spacing, shadow } = tokenNames(fm)
  return [
    ...header,
    `export const TEXT_SIZES = [${q(text)}] as const`,
    `export const SPACING_ALIASES = [${q(spacing)}] as const`,
    `export const SHADOWS = [${q(shadow)}] as const`,
    '',
  ].join('\n')
}
