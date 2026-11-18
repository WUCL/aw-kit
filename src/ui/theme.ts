// ─────────────────────────────────────────────────────────────
// aw-kit/ui 共用層代幣（inknock ADR 0002〈二〉）
// ─────────────────────────────────────────────────────────────
// 2026-11-19 自 inknock `src/shared/theme.ts` 機械搬入（值與註解原樣；註解裡的「本專案」「頁面」指 inknock，
// 歷史日期與批次編號都是 inknock 的紀錄）。
//
// 分層：
// - **共用層（本檔）**：間距、圓角、陰影、動效、字級／行高／字重、控制項高度、列高、圖示、互動、斷點、
//   版面、遮罩、疊層、狀態色。只能在 aw-kit 改，所有消費端一起生效。
// - **品牌層（各專案）**：`ThemeColors` 的值（中性色、主色角色、字體）與 `accent`／`secondary`／`avatar` 色階。
//   名稱由本檔定義（型別），值由專案的 `DESIGN.md` 填、在專案的 theme.ts 以 `createThemeFactory` 組起來。
//
// 共用層有兩份表示：本檔（TS 常數，inline style 用）與 `src/design-tokens/index.js` 的 `BASE`（產生 theme.css，Tailwind class 用）。
// 改值兩邊一起改；一致由 `tests/design-tokens/design-tokens.test.js` 驗（含陰影、行高、字重）。
//
// ⚠️ 已知照搬未改名（改名屬 inflorify 接入第 1 批「疊層換共用刻度」）：
//    `Z` 的 historyBar／preview／spBanner／viewer／guard 是 inknock 專屬名稱；`STATE.gold`、`STATE.marker` 同。
// ─────────────────────────────────────────────────────────────

// ─── 間距 ───────────────────────────────────────────────────
/** 唯一的數值來源。**頁面不直接挑階梯，走下面的情境別名。** */
export const SPACING = {
  '2xs':  2,
  xs:     4,
  sm:     8,
  md:    12,
  lg:    16,
  xl:    20,
  '2xl': 24,
  '3xl': 32,
  '4xl': 40,
  '5xl': 48,
} as const
/** 元件 props 收斂到此型別，讓「傳 13」在編譯期就是錯的（§8.2）。inline style 物件是 CSSProperties，型別擋不住，仍要靠 ESLint（§8.3）。 */
export type Spacing = typeof SPACING[keyof typeof SPACING]

/** 元素之間的距離。t-shirt 名不說明用途，所以別名層才是頁面該用的介面。 */
export const GAP = {
  hairline: SPACING.xs,      //  4 — 同一語意單位的兩行（主值＋副值）
  icon:     SPACING.sm,      //  8 — 圖示與其緊鄰文字（同一個可點區域內）
  inline:   SPACING.sm,      //  8 — 同列並排元素：按鈕群、標籤群、meta 列
  stack:    SPACING.md,      // 12 — 垂直堆疊的相關元素：卡片內連續段落（欄位標籤↔欄位是 inline 8，見 FormField）
  field:    SPACING.lg,      // 16 — 表單欄位之間、清單項目之間
  block:    SPACING['2xl'],  // 24 — 卡片之間、區塊之間
  section:  SPACING['3xl'],  // 32 — 頁面內大區塊之間
} as const

/**
 * 容器內距。
 *
 * 🔴 `rowY` 是 2026-08-28（批次 7c）**補進來的階**，值 10 不在 4pt 格線上。
 *    理由是計畫書 §2.3 自己的診斷：「token 不是被忽略，是接不住實際需要」。
 *    盤點發現密集清單列大量使用 `'8px 12px'`／`'10px 12px'`／`'10px 14px'`；
 *    照現有階梯只能圓到 `inputY`(12)，**那會讓一頁能看的列數變少**——
 *    而列數正是掃描面的核心指標（同一個理由讓 DESIGN.md 決定內文 15 不是 16）。
 *    ⚠️ **`rowY` 只給「密集清單列」**，不是通用的 10；表單與卡片仍走 `inputY`(12)。
 */
export const PAD = {
  control: SPACING.sm,       //  8 — 徽章、圖示按鈕
  rowY:    10,               // 10 — 密集清單列的垂直內距（刻意離開 4pt 格線，見上）
  inputY:  SPACING.md,       // 12 — 輸入框垂直
  inputX:  SPACING.lg,       // 16 — 輸入框水平
  card:    SPACING.xl,       // 20 — 卡片內距
  panel:   SPACING['2xl'],   // 24 — 側邊面板、對話框
  panelMobile: SPACING.lg,   // 16 — 手機側邊面板（外緣留 40 見 QuickView 計畫）
  page:    SPACING['2xl'],   // 24（桌機 32）— 頁面外框
} as const

// ─── 圓角 ───────────────────────────────────────────────────
// ⚠️ lg 由 12 → 10、xl 由 16 → 14：**key 名沒變、值變了，tsc 不會報**。
//    圓角越小越專業，不是越大越高級（Linear 8、Stripe 8、Vercel 6–8、Notion 4–6）。
export const RADIUS = {
  xs:   4,    // 色點、微型標記
  sm:   6,    // 標籤、chip、Badge（由膠囊 20 改方角）
  md:   8,    // 按鈕、輸入框、選單項
  lg:  10,    // 卡片、面板
  xl:  12,    // 大型容器、Modal（= Polaris --p-border-radius-300）
  pill: 9999, // Avatar、少數真正的膠囊
} as const
export type Radius = typeof RADIUS[keyof typeof RADIUS]

// ─── 陰影 ───────────────────────────────────────────────────
// 規則：陰影只給**真的浮起來的東西**。一般卡片靠髮絲邊框分隔（The Single-Separator Rule）。
//
// ✅ 批次 4（2026-08-28）：`card` 由 `0 1px 0 0 rgba(26,26,26,.07)` 改為 `none`。
//    原本是「白底 ＋ 邊框 ＋ 陰影」三重分隔，拿掉第三重。
//    ⚠️ **視覺影響極小**（實測：總覽最大單通道差 19、訂單紀錄 2），
//       因為邊框已是 lineStrong(#C2C2C2)，那條 7% 的線疊在它下面幾乎被吃掉。
//       這批的價值在**代幣層的一致性**，不在畫面——別期待看得出來。
//       量測留檔：`docs/design/mockups/39-批次4盤點.html`
//
// 🔴 **`card` 原本被兩種完全不同的用途共用，改動時必須分開**（2026-08-28 發現）：
//      ① 卡片的第三重分隔        → 就是本批要拿掉的，改 `none`
//      ② **灰底上的白色選取項**  → 導覽作用中項。白底貼在 navBg 上對比只有 1.06，
//         沒有那道線「目前在哪一頁」實際上看不出來——**它是唯一的辨識來源，不是裝飾**。
//    若當初直接把 `card` 一律設成 none，②會靜默失去可用性而 tsc／測試全部照過。
//    ②已改用**專屬的 `navActive`**，值與原本的 `card` 一模一樣——
//    **刻意讓導覽的像素零變化**：使用者批准的批次 4 是「幾乎沒有視覺效果」，
//    不該夾帶一個看得出來的導覽改動。
//    （試過改用 `raised`，實測導覽項上緣 235→226、下緣多 4px 柔邊漸層，
//      那是明顯可見的變化，留待日後單獨提案。）
export const SHADOW = {
  none:     'none',
  card:     'none',                                                        // 卡片不再有陰影（批次 4）
  navActive:'0 1px 0 0 rgba(26,26,26,.07)',                                // 灰底上的白色選取項（導覽作用中）
  raised:   '0 1px 2px rgba(20,24,28,.10), 0 0 0 1px rgba(20,24,28,.04)',  // 灰底上的白卡（選取項）
  menu:     '0 4px 16px rgba(20,24,28,.10)',                               // 下拉、tooltip
  panel:    '-8px 0 32px rgba(20,24,28,.10)',                              // SidePanel（桌機）
  panelTop: '0 -8px 32px rgba(20,24,28,.10)',                              // SidePanel（手機）
  modal:    '0 20px 60px rgba(20,24,28,.18)',
  knob:     '0 1px 3px rgba(20,24,28,.20)',                               // 開關（switch）的圓鈕
} as const

// ─── 動效 ───────────────────────────────────────────────────
// （2026-08-04 盤點全站 127 處 transition 後收斂，採用率 97%，本批不動）
export const MOTION = {
  fast: '0.1s',      // 極輕微回饋
  base: '0.15s',     // 全站主流：hover / focus / 顏色與邊框變化
  slow: '0.2s',      // 稍明顯的位移或展開
  slower: '0.25s',   // 淡入淡出、寬度變化
  panel: '220ms',    // 面板滑入滑出（2026-10-15 使用者定：280→220）
} as const

// easing 只收特殊曲線。**全站標準 easing 就是 CSS 關鍵字 `ease`，直接寫、不設 token**
export const EASING = {
  panel: 'cubic-bezier(0.32, 0.72, 0, 1)',   // iOS 風格曲線，面板 / 抽屜滑動
} as const

// ⚠️ 刻意**不**納入 token 的時長：資料視覺化長條的填充動畫（0.3s / 0.4s / 0.6s）。
//    那不是「隨手寫的不一致」，而是與 hover 回饋本質不同的用途——長條需要慢到看得出增長。

// ─── 字級 ───────────────────────────────────────────────────
// 命名改為**語意式**（2026-08-21 定案）。t-shirt 名不說明用途，所以每個人都自己猜
// ——那正是 12/14 字級氾濫的成因之一。
// ⚠️ 內文 15 不是 16：真正需要「大一點」的是**閱讀面**（面板、對話框、卡片），
//    那由 bodyLg(17) 負責；**表格是掃描面**，再往上會犧牲一列能放的欄位數。
export const FONT_SIZE = {
  caption:   12,  // 時間戳、單位、徽章內文、輔助註記
  meta:      13,  // 表頭、欄位標籤、次要資訊
  body:      15,  // ← 內文預設：表格儲存格、表單輸入、按鈕
  bodyLg:    17,  // 側邊面板內文、對話框、卡片主文
  title:     20,  // 卡片標題、區塊標題、面板標題
  pageTitle: 24,  // 頁面主標題（每頁唯一，且不與 Header 重複）
  amount:    30,  // 應收總計、結帳主金額
  kpi:       38,  // StatCard 主值
} as const
export type FontSize = typeof FONT_SIZE[keyof typeof FONT_SIZE]

// 行高階梯
// **實作策略：不逐處標註。** index.css 的 body 設 1.5 為全域基準，
// 單行控制項與標題在「元件層」覆寫，只有多行段落需要 inline 指定 prose。
// ⚠️ 三個**靜默**值變更（key 名不變，tsc 不會報）：
//    tight 1.25→1.1（KPI 放大到 38，行高要跟著收）
//    snug  1.3 →1.35
//    body  1.5 →1.6（內文由 14 升 15，行高一併放鬆）——**同步改 index.css 的全域基準**
export const LINE_HEIGHT = {
  none:   1,    // 單行控制項：button / badge / pill / 表頭
  tight:  1.1,  // KPI（38）
  amount: 1.2,  // 金額（30）
  page:   1.3,  // 頁面標題（24）
  snug:   1.35, // 區塊／卡片標題（20）
  title:  1.4,  // caption / meta；亦用於 padding-based 的 pill / badge
                //   （它們不像 button 有固定高度可靠 flex 置中，需要 1.4 撐出形狀）
  body:   1.6,  // 內文、表格列（15–17）— 全域基準
  prose:  1.7,  // 多行段落：說明文、備註、空狀態引導語
} as const

// 字重——**中文與數字分軌**
// PingFang TC 最粗只到 600(Semibold)，700/800 會被瀏覽器合成假粗體。
// 規則：元素內容含中文 → 最高 semibold(600)；純數字／拉丁 → 可用 bold(700)。
// 副作用是正向的：中文封頂後，金額與 KPI 自動比周圍中文更突出，不必再靠顏色。
export const FONT_WEIGHT = {
  normal: 400,
  medium: 500,
  semibold: 600,   // 中文的上限
  bold: 700,       // 數字／拉丁（金額、KPI）
} as const

// ─── 控制項高度（2026-11-13 方案 B＝shadcn 原版，ADR 0001〈外觀定案〉D13；取代 2026-08-25 M11）──
// 桌機、iPad、手機同一套，不再於手機升高。可點範圍與外觀分開：Button 與 `.hit-area`（src/index.css）
// 用 ::after 往上下補到 44（ROW_H.touch），外觀維持 28／32／36。輸入框／下拉做不到（::after 對 input 無效），接受 32。
export const CONTROL_H = {
  sm: 28,   // 表格內嵌控制項
  md: 32,   // 預設：按鈕、輸入框、下拉（桌機、iPad、手機同一套）
  lg: 36,   // 主要 CTA
} as const

// 版面列高（DESIGN.md row-height）：不是控制項，不跟著控制項高度變。
// 判準：導覽列、清單列、選單項等「整列可點的版面」用這個；按鈕、輸入框、下拉用 CONTROL_H。
export const ROW_H = {
  nav: 36,     // 桌機側欄導覽列
  touch: 44,   // 觸控清單列（手機抽屜、選單項）與最小可點範圍
} as const

// ─── 圖示 ───────────────────────────────────────────────────
// 線寬混用是「看起來廉價」最被低估的來源：同一列裡 strokeWidth 2 配 2.5，
// 使用者不會意識到原因，但會感覺「像是不同人畫的」。
export const ICON = {
  sm: 14,   // 內嵌於文字行內：徽章、表格儲存格、meta 列
  md: 16,   // 預設：按鈕、選單項、工具列
  lg: 20,   // 導覽側欄、頁面標題旁
  xl: 24,   // 空狀態、大型入口
} as const

/**
 * 全站唯一線寬（Lucide／Feather 標準值）。
 *
 * 🔴 **2026-08-28 由 1.75 改為 2**（批次 3.5）。計畫書原本訂 1.75，理由是「細線比較精緻」——
 *    但那個推論漏掉一件事：**`strokeWidth` 是 viewBox 單位，不是像素**。
 *    實際渲染粗細 ＝ `strokeWidth × (width ÷ 24)`，所以同一個值套在不同尺寸上，
 *    看起來的粗細完全不同：
 *      1.75 @ size 8  → 0.58px（幾乎看不見）
 *      1.75 @ size 24 → 1.75px
 *      1.75 @ size 36 → 2.62px
 *    現況本來就差 2.9 倍（1.0–2.92px），照原規則做會變成差 4.5 倍——
 *    「統一數字」不等於「統一觀感」，而計畫書想要的是後者。量測留檔：mockup 43。
 *
 * ✅ 改用 Lucide／Feather 的做法：**一個固定線寬，讓渲染粗細隨尺寸自然縮放**。
 *    好處是可 grep、日後從圖示庫貼新圖示不必換算（它們預設就是 2）。
 *    ⚠️ 前提是**尺寸也要收斂**到 ICON 階梯——8/9px 那種配 2 只有 0.67px，太細。
 *       目前僅存的例外是結帳頁的 8/9px 勾選（sw 3.5–4 是正確的補償），留給批次 13。
 */
export const ICON_STROKE = 2

// ─── 互動狀態 ───────────────────────────────────────────────
// ⚠️ 命名注意：本檔另有一個 `STATE`（語意色，356 處在用），故這組叫 `INTERACTION`。
// 停用一律用透明度，**不另調灰色**——調灰會與「次要文字」撞色，
// 使用者分不出「這是說明文字」還是「這個按鈕不能按」。
export const INTERACTION = {
  hoverSurface: 'rgba(20,24,28,0.04)',  // 可點列、選單項、卡片 → 疊一層極淡底
  activeScale: 0.98,                    // 按下的回饋，只給 Button
  disabledOpacity: 0.45,                // 停用一律用透明度
} as const

export const BREAKPOINTS = {
  mobile: 768,
  tablet: 1024,
} as const

// 內容寬度（2026-10-07 mockup 103 ②，DESIGN.md「內容寬度與 Sidebar」）。
// 判準：頁內有表格或兩個以上平行區塊 → 滿寬（≥tablet 雙欄）；只有一份表單／一張清單 → formMax 靠左。
// 只有這一個值——原本設定頁各寫 560／600／640／720／760，收斂成同一個。
export const LAYOUT = {
  formMax: 720,
} as const

// 遮罩色（2026-10-14）：SidePanel 與 HeaderDropdown（手機）共用，DESIGN.md 定義 0.3
export const SCRIM = 'rgba(0,0,0,0.3)'

// 疊層階梯（2026-08-09 新增）
// **這份階梯是「把現況寫下來」，不是重新編號**——每個值都等於原本硬編的數字，
// 套用後行為零變化。目的是讓「誰在誰上面」變成可讀、可 grep 的一份清單。
// 只收「全域 overlay」；CalendarPage 等區域性的 1~10 在自己的 stacking context 內，不納入。
export const Z = {
  // 閱讀用的置中放大視窗（業績摘要卡片）。**刻意在 panelBase 之下**：放大裡點設計師
  // 要開 QuickView，面板必須蓋在放大視窗上面（2026-09-26 使用者定）。仍高於 MobileDrawer(80/81)。
  readingOverlay: 90,
  panelBase: 100,   // SidePanel：panelBase + level*10（遮罩），+1（面板本體）
  // 新面板殼（src/shared/ui/panel，QuickView 收斂）：每層一個 SlideOver 全部保留掛載（2026-10-15 翻案 ⑧）。
  // 第 d 層（0 起算）遮罩 panelHost+2d、面板 +2d+1；MAX_DEPTH=8 → 最高 panelHost+15=175。
  // 疊在舊 SidePanel（實務最多到 level 3＝131）之上、低於 menu(200)，頂部下拉不會被任何一層面板蓋住，Modal(500) 恆在所有面板之上。
  // ⚠️ 不能用「每層 +10」：8 層會到 190+71=261，壓過 menu(200)。
  panelHost: 160,
  menu: 200,        // 下拉選單：BrandMenu / BellMenu / GlobalSearch / overflow-menu
  modal: 500,       // Modal 預設（內容為 +1）
  historyBar: 900,  // 結帳頁客戶歷史（需蓋過一般 Modal 的內容型 overlay）
  preview: 999,     // 結帳預覽
  spBanner: 2000,   // SP 檢視浮動列——在一般面板之上、需當下回應的對話框之下
  viewer: 2100,     // 附檔檢視器（AttachmentViewer）——需蓋過 SP 浮動列，否則 SP 檢視時
                    // 那條浮動列會壓在檢視器的標題列與關閉、下載鈕上面
  guard: 9000,      // 未存變更攔截、結帳確認
  dialog: 9500,     // confirm-dialog（全站最高的自家元件）
  toast: 9999,      // aw-notify-kit 的 --fbk-z-toast，實際覆寫在 src/index.css，列此僅為完整性
} as const

// ─────────────────────────────────────────────────────────────
// State tokens — 訂單狀態、錯誤、通知、品牌標記等語意色
// 命名規則：state.{name}.{base|dark|bg|text|border}
// ⚠️ 語意色由 5 收斂到 2（2026-08-21 定案）：鼠尾草在 OKLCH 164°、原「已完成」綠
//    #22C55E 在 150°，相距僅 14°——選了綠當品牌色，品牌強調與成功狀態就是同一個
//    色相家族，使用者無法從顏色分辨。**只有「待確認」(warning) 與「退費」(danger)
//    保留顏色，其餘改中性外框 ＋ 色點。** success/gold 保留定義供既有呼叫端過渡，
//    批次 3 重寫 badge.tsx 時收掉。
// ─────────────────────────────────────────────────────────────
export const STATE = {
  success: {
    base: '#22C55E',
    dark: '#16A34A',
    bg: '#EAF5EF',
    text: '#14532D',
  },
  warning: {
    base: '#F59E0B',
    dark: '#B45309',
    bg: '#FEF3C7',
    text: '#92400E',
    border: '#FDE68A', // 琥珀提示框的淺邊框（2026-09-30 收斂分潤／預約頁的硬編值）
  },
  // marker — 品牌語意標記（公關訂單、特殊備註 callout），與 warning 區隔
  marker: {
    base: '#F97316',
    dark: '#9A3412',
    bg: '#FFF7ED',
    border: '#FDBA74',
    text: '#92400E',
    textDark: '#78350F',
  },
  danger: {
    base: '#EF4444',
    dark: '#DC2626',
    bg: '#FEE2E2',
    text: '#7F1D1D',
    // 整片區域染紅時，bg(#FEE2E2) 太重、會和其上的紅色元件互相打架。
    // bgSoft 用於「大面積底色」，border 是配它的淺邊框。
    bgSoft: '#FFF7F7',
    border: '#F0A8A8',
  },
  // gold — 達成獎勵語意（資料完整度 100%）
  gold: {
    base: '#D97706',
    bg: '#FFFBEB',
  },
  // neutral — 中性 / 失效語意（作廢訂單、停用狀態）；亦為收斂後「已完成／進行中」的底
  neutral: {
    base: '#9CA3AF',   // 色點（裝飾性指示器，非文字，不受 4.5 對比要求）
    dark: '#6B7280',
    bg: '#F4F5F6',
    text: '#374151',   // on bg 對比 9.37 ✓
  },
} as const

export type ThemeColors = {
  navBg: string
  navBgHover: string
  navFg: string
  navFgActive: string
  navActiveBg: string
  inkSurface: string
  inkSurfaceHover: string
  tableHeaderBg: string
  lineStrong: string
  lineSection: string
  accent100: string
  link: string
  accent300: string
  accent600: string
  accent50: string
  neutralSunken: string
  canvas: string
  surfaceSunken: string
  surface: string
  line: string
  lineControl: string
  ink: string
  inkMuted: string
  inkFaint: string
  font: string
}

// ─── 品牌層的形狀與主題組裝 ─────────────────────────────────

/** 色階：50～800 九階 */
export type Palette = { readonly 50: string; readonly 100: string; readonly 200: string; readonly 300: string; readonly 400: string; readonly 500: string; readonly 600: string; readonly 700: string; readonly 800: string }

/** 專案提供的品牌層：名稱固定（本型別），值由專案填 */
export type BrandTokens = {
  colors: ThemeColors
  accent: Palette
  secondary: Palette
  avatar: readonly [string, string, string, string, string]
}

export type Theme<B extends BrandTokens = BrandTokens> = ThemeColors & {
  accent: B['accent']
  secondary: B['secondary']
  avatar: B['avatar']
  spacing: typeof SPACING
  gap: typeof GAP
  pad: typeof PAD
  radius: typeof RADIUS
  shadow: typeof SHADOW
  scrim: typeof SCRIM
  fontSize: typeof FONT_SIZE
  lineHeight: typeof LINE_HEIGHT
  fontWeight: typeof FONT_WEIGHT
  controlH: typeof CONTROL_H
  rowH: typeof ROW_H
  icon: typeof ICON
  iconStroke: typeof ICON_STROKE
  interaction: typeof INTERACTION
  breakpoints: typeof BREAKPOINTS
  layout: typeof LAYOUT
  z: typeof Z
  state: typeof STATE
  motion: typeof MOTION
  easing: typeof EASING
}

/**
 * 以專案的品牌層建立 `createTheme`。`createTheme(overrides)` 可覆寫部分品牌色（目前沒有消費端在用執行期換色，
 * 保留是為了不改變 inknock 既有 API）。`link` 沒指定時跟著 `accent600`，再退回品牌預設。
 */
export function createThemeFactory<B extends BrandTokens>(brand: B) {
  return function createTheme(overrides: Partial<ThemeColors> = {}): Theme<B> {
    return {
      ...brand.colors,
      ...overrides,
      link: overrides.link ?? overrides.accent600 ?? brand.colors.link,
      accent: brand.accent,
      secondary: brand.secondary,
      avatar: brand.avatar,
      spacing: SPACING,
      gap: GAP,
      pad: PAD,
      radius: RADIUS,
      shadow: SHADOW,
      scrim: SCRIM,
      fontSize: FONT_SIZE,
      lineHeight: LINE_HEIGHT,
      fontWeight: FONT_WEIGHT,
      controlH: CONTROL_H,
      rowH: ROW_H,
      icon: ICON,
      iconStroke: ICON_STROKE,
      interaction: INTERACTION,
      breakpoints: BREAKPOINTS,
      layout: LAYOUT,
      z: Z,
      state: STATE,
      motion: MOTION,
      easing: EASING,
    }
  }
}
