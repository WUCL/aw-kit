import { cva } from "class-variance-authority"
import { cn } from "../cn"

// inknock: 自家改動（上游原樣：vendor/shadcn-base/aria-nova-4.23.0-2026-11-15/tabs.tsx；ADR 0001〈外觀定案〉D7：Tabs／Segmented 合併，以 variant 區分）
//   - 拿掉 react-aria-components 元件（ADR 0002 決策 6）：包裝層只取 class、渲染原生元素，RAC 元件從未被渲染；class 字串一字未改
//   - default（取代舊 Segmented）：高度 h-8 → h-(--control-h-md)，新增 size sm＝h-(--control-h-sm)（行事曆頁首，同舊 Segmented）；圓角 rounded-lg 照上游（D1 彈出層／群組 10）
//   - line（取代舊 Tabs）：分頁列不置中、不縮寬（w-full justify-start）、列高 h-11（44，分頁籤列＝版面列高，舊 Tabs 同值）、
//     可橫向捲動不換行（換行會讓下方列表起點跳動）；項目不 flex-1。
//     項目左右各留 6（px-1.5）給焦點框呼吸、底線內縮 6（after:inset-x-1.5，仍與文字等寬），間距 gap-stack（12）＋兩側 6＝文字間距 24（舊 Tabs 同值）；
//     清單外側由包裝層抵銷這 6（shell 內距 16→10、panel 往外 -6），文字位置與舊版差 1–2px（項目的 1px 透明框線、計數／圓點間距 gap-1.5）
//   - 字重 font-medium → font-semibold（D6：600；且選取前後字重不變，避免切換時整列左右位移）
//   - 未選字色 text-foreground/60 → text-ink-muted（舊兩元件同色）；hover 照上游
//   - line 底線：bg-foreground → bg-brand（選取色＝品牌色，ADR〈第一階段必做〉①；2026-11-13 對照圖）、位置 bottom-[-5px] → bottom-0（貼齊列底）
//   - 加 cursor-pointer（上游 cursor-default；現行兩元件都是手指）
//   - line 的焦點框改 ring-inset、不畫 outline：清單是橫向捲動容器（overflow 裁切），項目又是 h-full，外擴的 ring／outline 會被裁掉（2026-11-15 review）；
//     inset 框靠上面那 6px 內距才不會貼字（2026-11-15 補審）
//   - 抽出 tabsTriggerClassName：包裝層（src/shared/ui/tabs.tsx）渲染原生 <button> 時共用（同 Button 做法）
//   focus ring、陰影、動畫照上游
const tabsListVariants = cva(
  "group/tabs-list inline-flex w-fit items-center justify-center rounded-lg p-[3px] text-muted-foreground group-data-horizontal/tabs:h-(--control-h-md) group-data-horizontal/tabs:data-[size=sm]:h-(--control-h-sm) group-data-vertical/tabs:h-fit group-data-vertical/tabs:flex-col data-[variant=line]:rounded-none",
  {
    variants: {
      variant: {
        default: "bg-muted",
        line: "w-full justify-start gap-stack overflow-x-auto overflow-y-hidden bg-transparent p-0 group-data-horizontal/tabs:h-11",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export const tabsTriggerClassName = cn(
  "relative inline-flex h-[calc(100%-1px)] flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-md border border-transparent px-1.5 py-0.5 text-sm font-semibold whitespace-nowrap text-ink-muted transition-all group-data-vertical/tabs:w-full group-data-vertical/tabs:justify-start hover:text-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-1 focus-visible:outline-ring disabled:pointer-events-none disabled:opacity-50 has-data-[icon=inline-end]:pr-1 has-data-[icon=inline-start]:pl-1 data-[disabled]:pointer-events-none data-[disabled]:opacity-50 dark:text-muted-foreground dark:hover:text-foreground group-data-[variant=default]/tabs-list:data-selected:shadow-sm group-data-[variant=line]/tabs-list:data-selected:shadow-none group-data-[variant=default]/tabs-list:data-active:shadow-sm group-data-[variant=line]/tabs-list:data-active:shadow-none [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  "group-data-[variant=line]/tabs-list:focus-visible:ring-inset group-data-[variant=line]/tabs-list:focus-visible:outline-none group-data-[variant=line]/tabs-list:h-full group-data-[variant=line]/tabs-list:flex-none group-data-[variant=line]/tabs-list:rounded-none group-data-[variant=line]/tabs-list:px-1.5 group-data-[variant=line]/tabs-list:bg-transparent group-data-[variant=line]/tabs-list:data-selected:bg-transparent dark:group-data-[variant=line]/tabs-list:data-selected:border-transparent dark:group-data-[variant=line]/tabs-list:data-selected:bg-transparent",
  "data-selected:bg-background data-selected:text-foreground dark:data-selected:border-input dark:data-selected:bg-input/30 dark:data-selected:text-foreground",
  "after:absolute after:bg-brand after:opacity-0 after:transition-opacity group-data-horizontal/tabs:after:inset-x-0 group-data-[variant=line]/tabs-list:after:inset-x-1.5 group-data-horizontal/tabs:after:bottom-0 group-data-horizontal/tabs:after:h-0.5 group-data-vertical/tabs:after:inset-y-0 group-data-vertical/tabs:after:-right-1 group-data-vertical/tabs:after:w-0.5 group-data-[variant=line]/tabs-list:data-selected:after:opacity-100"
)

export { tabsListVariants }
