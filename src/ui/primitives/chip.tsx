import { cva } from "class-variance-authority"

// inknock: Chip（屬性標記）的樣式。shadcn 沒有 chip，形狀取自 Badge（primitives/badge.tsx 的 attribute 色調）同一族：
//   有框無底、6px 方角、caption／meta 字級＋行高 1.4、不帶色點（「色點＝這是狀態」，屬性標記不該有，見 chip.tsx）。
//   2026-11-15 改走 class，**外觀與換之前相同**（原本取自 badge-tone.markerShape，比較頁 getComputedStyle 逐屬性比對）。
//   字重 500，與 Badge 的屬性標記（marker／attribute）相同（2026-11-15 使用者定案統一；換之前 Badge 屬性是 600）
export const chipVariants = cva(
  "inline-flex items-center rounded-sm border font-medium whitespace-nowrap",
  {
    variants: {
      tone: {
        default: "border-line-control bg-surface text-ink-muted",
        // 唯一的強調屬性（例：主店）：仍是有框的形狀，實心淺底會在 hover／選取列的底色上消失（mockup 108 A1）
        accent: "border-accent-100 bg-accent-50 text-accent-600",
      },
      size: {
        sm: "text-caption",
        md: "text-meta",
      },
      // 一般標籤（截斷、不被壓）／已套用條件的標籤（文字＋移除鈕：左內距＝控制項內距，右邊與上下由 32 的移除鈕撐出，
      // 不截斷、不設最大寬）。差異寫在這裡，不在事後用 cn() 蓋掉（補審：能不能蓋掉取決於 tailwind-merge 與 CSS 輸出順序）
      kind: {
        static: "max-w-full shrink-0 py-[2px]",
        removable: "pl-control",
      },
    },
    compoundVariants: [
      { kind: "static", size: "sm", class: "px-[7px]" },
      { kind: "static", size: "md", class: "px-[9px]" },
    ],
    defaultVariants: { tone: "default", size: "sm", kind: "static" },
  }
)

/** 已套用條件的 chip（FilterBar 等）：同一份 chipVariants 的 removable 款 */
export const removableChipClassName = chipVariants({ kind: "removable", size: "sm" })
