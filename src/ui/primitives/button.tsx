"use client"

import { cva } from "class-variance-authority"

// inknock: 自家改動（上游原樣：vendor/shadcn-base/aria-nova-4.23.0-2026-11-13/button.tsx；ADR 0001〈外觀定案〉）
//   - 拿掉 react-aria-components 元件（ADR 0002 決策 6）：包裝層只取 class、渲染原生元素，RAC 元件從未被渲染；class 字串一字未改
//   - 圓角 rounded-lg → rounded-md（D1：控制項 8px，class 名與 DESIGN.md rounded 同名）
//   - 字重 font-medium → font-semibold（D6：600）
//   - 加 cursor-pointer（Tailwind v4 preflight 把按鈕游標改成 default；現行全站是手指）
//   - 可點範圍至少 44px 高（after 偽元素往上下擴，外觀不變；shadcn 的 checkbox／switch 也用 after 擴大可點範圍）：
//     iPad 是主載具，蘋果建議觸控目標 ≥ 44pt；按鈕本身 ≥ 44 時 min(0px, …) 讓它不縮
//   - disabled:pointer-events-none → disabled:cursor-not-allowed：停用按鈕的 title 要能滑出提示
//     （「需等該月結束後才能封存」「請先儲存或還原變更」等 7 處靠它說明為什麼不能按）
//   - outline 框 border-border → border-input（DESIGN.md button-secondary 用 line-control）
//   - ghost 字色 text-muted-foreground（DESIGN.md button-ghost 用 ink-muted）
//   - destructive 改實心紅底白字（D2）；新增 cta（完成金流專用，品牌色）；link 用 inknock 連結色
//   - outline 加 text-foreground：scoped preflight 讓按鈕 color: inherit，放在淡色容器裡字會跟著變淡（2026-11-13 review）
//   - 尺寸：高度引用 --control-h-*（DESIGN.md control-height，2026-11-13 起與上游同值 28／32／36）、sm 字級 text-meta；
//     內距、圖示間距照上游（2026-11-13 使用者在比較頁試過後選定）
const buttonVariants = cva(
  "group/button relative inline-flex shrink-0 cursor-pointer items-center after:absolute after:inset-x-0 after:inset-y-[min(0px,calc((100%_-_44px)/2))] justify-center rounded-md border border-transparent bg-clip-padding text-sm font-semibold whitespace-nowrap transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring active:not-aria-[haspopup]:translate-y-px disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:focus-visible:ring-2 aria-invalid:focus-visible:ring-ring aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/80",
        outline:
          "border-input bg-background text-foreground hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground dark:border-input dark:bg-input/30 dark:hover:bg-input/50",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-[color-mix(in_oklch,var(--secondary),var(--foreground)_5%)] aria-expanded:bg-secondary aria-expanded:text-secondary-foreground",
        ghost:
          "text-muted-foreground hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground dark:hover:bg-muted/50",
        destructive:
          "bg-danger-base text-white hover:bg-danger-dark dark:bg-destructive/20 dark:hover:bg-destructive/30 dark:focus-visible:ring-destructive/40",
        cta: "bg-brand text-brand-foreground hover:bg-brand/90",
        link: "text-link underline-offset-4 hover:underline",
      },
      size: {
        default:
          "h-(--control-h-md) gap-1.5 px-2.5 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
        xs: "h-6 gap-1 rounded-[min(var(--radius-md),10px)] px-2 text-xs in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-(--control-h-sm) gap-1 px-2.5 text-meta in-data-[slot=button-group]:rounded-md has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-(--control-h-lg) gap-1.5 px-2.5 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
        icon: "size-(--control-h-md)",
        "icon-xs":
          "size-6 rounded-[min(var(--radius-md),10px)] in-data-[slot=button-group]:rounded-lg [&_svg:not([class*='size-'])]:size-3",
        "icon-sm":
          "size-(--control-h-sm) in-data-[slot=button-group]:rounded-md",
        "icon-lg": "size-(--control-h-lg)",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export { buttonVariants }
