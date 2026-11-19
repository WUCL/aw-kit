"use client"

// inknock: 自家改動（上游原樣：vendor/shadcn-base/aria-nova-4.23.0-2026-11-13/input.tsx；ADR 0001〈外觀定案〉）
//   - 拿掉 react-aria-components 元件（ADR 0002 決策 6）：包裝層只取 class、渲染原生元素，RAC 元件從未被渲染；class 字串一字未改
//   - 圓角 rounded-lg → rounded-md（D1：控制項 8px）
//   - 高度 h-8 → h-(--control-h-md)（DESIGN.md control-height，與上游同為 32）
//   - 底色 bg-transparent → bg-background（白）：欄位放在凹陷灰底上時不透出灰底（現行欄位一律白底）
//   - 停用 disabled:bg-input/50 disabled:opacity-50 → 凹陷底＋lineStrong 框＋淡字、不透明（DESIGN.md 2026-10-08 mockup 109 a1，同 Button D12）
//   - 錯誤色 destructive → danger-base（DESIGN.md 錯誤框色；destructive 在本專案對應較深的 danger-dark）
//   - 錯誤＋聚焦：外圈改品牌色 aria-invalid:focus-visible:ring-2 aria-invalid:focus-visible:ring-ring（上游錯誤＋聚焦與錯誤長得一樣、看不出焦點；2026-11-13 使用者選定）
//   - placeholder 色 muted-foreground → ink-faint（DESIGN.md 次要文字層級）
//   - 拿掉 disabled:pointer-events-none（同 Button）：停用欄位的 title 要能滑出提示、禁止游標要出現（2026-11-15 數字欄補審；
//     例：領料單鎖定的交付數量「要更正請作廢整張單」）
//   - 加 text-foreground：scoped preflight 讓欄位 color: inherit，放在淡色容器裡（排序下拉的灰字標籤）字會跟著變灰；舊 inline 版明寫 T.ink
//   - 抽出 inputClassName：包裝層（src/shared/ui/input.tsx）渲染原生 <input> 時共用同一串（同 Button 的 buttonVariants 做法）
//   內距 px-2.5、focus ring、動畫照上游（2026-11-13 DECISIONS「Input／Select 內距照 shadcn」）
const inputClassName =
  "h-(--control-h-md) w-full min-w-0 rounded-md border border-input bg-background px-2.5 text-foreground py-1 text-base transition-colors outline-none file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-ink-faint focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:border-line-strong disabled:bg-surface-sunken disabled:text-ink-faint aria-invalid:border-danger-base aria-invalid:ring-3 aria-invalid:ring-danger-base/20 aria-invalid:focus-visible:ring-2 aria-invalid:focus-visible:ring-ring md:text-sm dark:bg-input/30 dark:disabled:bg-input/80 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40"

export { inputClassName }
