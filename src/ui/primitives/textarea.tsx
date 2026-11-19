"use client"

// inknock: 自家改動（上游原樣：vendor/shadcn-base/aria-nova-4.23.0-2026-11-13/textarea.tsx）——同 primitives/input.tsx：
//   - 拿掉 react-aria-components 元件（ADR 0002 決策 6）：包裝層只取 class、渲染原生元素，RAC 元件從未被渲染；class 字串一字未改
//   rounded-md、bg-background、停用凹陷底＋lineStrong 框＋淡字、錯誤色 danger-base、錯誤＋聚焦外圈改品牌色、text-foreground（同 input）、
//   拿掉 field-sizing-content：它讓 rows 失效（特殊備注 rows=5 一開始只有 64 高）、長文無上限地撐高面板；改回 rows 決定初始高度＋只准上下拉（2026-11-13 review）、placeholder ink-faint、抽出 textareaClassName
const textareaClassName =
  "flex min-h-16 w-full rounded-md border border-input bg-background text-foreground px-2.5 py-2 text-base transition-colors outline-none placeholder:text-ink-faint focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:border-line-strong disabled:bg-surface-sunken disabled:text-ink-faint aria-invalid:border-danger-base aria-invalid:ring-3 aria-invalid:ring-danger-base/20 aria-invalid:focus-visible:ring-2 aria-invalid:focus-visible:ring-ring md:text-sm dark:bg-input/30 dark:disabled:bg-input/80 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40"

export { textareaClassName }
